import crypto from "crypto";
import nodeBase64 from "nodejs-base64-converter";
import request, { head } from "request";
import axios from "axios";
import fs from "fs";
import { PassThrough } from "stream";
import { v4 as uuidv4 } from "uuid";
import { webcrypto } from "crypto";
import bodyParser from "body-parser";
import path from "path";
import { Queue, Worker, QueueEvents } from "bullmq";
import { Mutex } from "async-mutex";
import { validate as validateEmail } from "email-validator";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

export default {
  id: "api",
  handler: (router, { env, services, getSchema, exceptions, database }) => {
    const allowedDomains = [
      "lumixgen.com",
      "dashboard.lumixgen.com",
      "localhost:5173",
    ];
    // Domain whitelist middleware to protect API endpoints
    function createDomainProtectionMiddleware(allowedDomains = []) {
      return (req, res, next) => {
        // Get the origin header
        const origin = req.headers.origin;

        // Get the referer header (sometimes more reliable than origin)
        const referer = req.headers.referer;

        // Get the user-agent to detect API tools like Postman
        const userAgent = req.headers["user-agent"] || "";

        // Block common API testing tools
        if (
          userAgent.includes("Postman") ||
          userAgent.includes("insomnia") ||
          userAgent.includes("curl") ||
          userAgent.includes("HTTPie")
        ) {
          return res.status(403).json({
            error: "API access from this client is not allowed",
            code: "FORBIDDEN_CLIENT",
          });
        }

        // If no origin or referer, it's likely a direct API call not from a browser
        if (!origin && !referer) {
          return res.status(403).json({
            error: "Cross-origin requests require proper headers",
            code: "MISSING_ORIGIN",
          });
        }

        // Check if the request comes from an allowed domain
        const isAllowedOrigin = allowedDomains.some((domain) => {
          if (origin && origin.includes(domain)) return true;
          if (referer && referer.includes(domain)) return true;
          return false;
        });

        if (!isAllowedOrigin) {
          return res.status(403).json({
            error: "Access from this domain is not permitted",
            code: "DOMAIN_NOT_ALLOWED",
          });
        }

        // Request is from an allowed domain, proceed
        next();
      };
    }
    function protectRoute(routeHandler) {
      return [createDomainProtectionMiddleware(allowedDomains), routeHandler];
    }


    const {
      UsersService,
      RolesService,
      PermissionsService,
      ItemsService,
      FilesService,
      MailService,
    } = services;

    // Yetkilendirme bilgileri
    const accountability = {
      id: env.ADMIN_USER_ID,
      admin: true,
    };

    async function getRoleByName(roleName) {
      const rolesService = new RolesService({
        schema: await getSchema(),
        accountability: accountability,
      });

      const roles = await rolesService.readByQuery({
        fields: ["*"],
      });

      return roles.find((role) => role.name === roleName);
    }

    const registerMutex = new Mutex();
    const resendVerifyTokenMutex = new Mutex();
    const verifyEmailMutex = new Mutex();
    const googleLoginMutex = new Mutex();
    const changeTfaMutex = new Mutex();
    const userMutex = new Mutex();

    const registerAttempts = new Map();



    {
      /*
      //////////////////////////////////////////////////////
      //////////////////// FONKSİYONLAR ////////////////////
      //////////////////////////////////////////////////////
    */
    }

    // Disposable/geçici email servislerinin listesi
    const disposableEmailDomains = [
      "tempmail.com",
      "guerrillamail.com",
      "10minutemail.com",
      "throwaway.email",
      "mailinator.com",
      "maildrop.cc",
      "temp-mail.org",
      "getnada.com",
      "trashmail.com",
      "yopmail.com",
      "fakeinbox.com",
      "sharklasers.com",
      "guerrillamail.info",
      "grr.la",
      "guerrillamail.biz",
      "guerrillamail.de",
      "spam4.me",
      "getairmail.com",
      "dispostable.com",
      "mohmal.com",
    ];

    /**
     * Email adresinin geçerli ve gerçek olup olmadığını doğrular
     * @param {string} email - Doğrulanacak email adresi
     * @returns {Promise<{valid: boolean, error: string|null}>}
     */
    async function validateRealEmail(email) {
      try {
        // 1. Temel format kontrolü
        if (!validateEmail(email)) {
          return { valid: false, error: "Invalid email format." };
        }

        // 2. Domain çıkar
        const domain = email.split("@")[1];

        // 3. Disposable email kontrolü
        if (disposableEmailDomains.includes(domain.toLowerCase())) {
          return {
            valid: false,
            error: "Temporary email addresses are not allowed.",
          };
        }

        // 4. DNS MX record kontrolü - domain'in gerçek mail sunucusu var mı?
        try {
          const mxRecords = await resolveMx(domain);
          if (!mxRecords || mxRecords.length === 0) {
            return {
              valid: false,
              error: "Email domain does not have a valid mail server.",
            };
          }
        } catch (dnsError) {
          // DNS hatası - domain mevcut değil veya MX kaydı yok
          return {
            valid: false,
            error: "Email domain does not exist or is invalid.",
          };
        }

        // Tüm kontroller başarılı
        return { valid: true, error: null };
      } catch (error) {
        console.error("Email validation error:", error);
        return { valid: false, error: "Email validation failed." };
      }
    }

    /**
     * IP bazlı rate limiting kontrolü - saatte maksimum 3 kayıt
     * @param {string} ip - Kullanıcının IP adresi
     * @returns {{allowed: boolean, error: string|null, remainingAttempts: number, resetTime: Date|null}}
     */
    function checkRegisterRateLimit(ip) {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 saat milisaniye cinsinden
      const maxAttempts = 3;

      // IP için kayıt var mı kontrol et
      if (registerAttempts.has(ip)) {
        const attempt = registerAttempts.get(ip);

        // Süre dolmuş mu kontrol et
        if (now > attempt.resetTime) {
          // Süre dolmuş, yeni süre başlat
          registerAttempts.set(ip, {
            count: 1,
            resetTime: now + oneHour,
          });
          return {
            allowed: true,
            error: null,
            remainingAttempts: maxAttempts - 1,
            resetTime: new Date(now + oneHour),
          };
        }

        // Limit aşılmış mı?
        if (attempt.count >= maxAttempts) {
          const resetDate = new Date(attempt.resetTime);
          const minutesLeft = Math.ceil(
            (attempt.resetTime - now) / (60 * 1000)
          );
          return {
            allowed: false,
            error: `Too many registration attempts. Please try again in ${minutesLeft} minutes.`,
            remainingAttempts: 0,
            resetTime: resetDate,
          };
        }

        // Hala limitte, sayacı artır
        attempt.count++;
        registerAttempts.set(ip, attempt);
        return {
          allowed: true,
          error: null,
          remainingAttempts: maxAttempts - attempt.count,
          resetTime: new Date(attempt.resetTime),
        };
      }

      // İlk kayıt denemesi
      registerAttempts.set(ip, {
        count: 1,
        resetTime: now + oneHour,
      });

      return {
        allowed: true,
        error: null,
        remainingAttempts: maxAttempts - 1,
        resetTime: new Date(now + oneHour),
      };
    }

    /**
     * Eski rate limit kayıtlarını temizle (memory leak önleme)
     * Her 30 dakikada bir çalışır
     */
    setInterval(() => {
      const now = Date.now();
      for (const [ip, attempt] of registerAttempts.entries()) {
        if (now > attempt.resetTime) {
          registerAttempts.delete(ip);
        }
      }
      console.log(`Rate limit cleanup: ${registerAttempts.size} active IPs`);
    }, 30 * 60 * 1000); // 30 dakika

    async function createUser(usersService, userData) {
      return await usersService.createOne({
        icon: "attractions",
        ...userData,
      });
    }

    function logError(error) {
      if (error instanceof Error) {
        console.error("Auth extension error:", error.message, error.stack);
        return;
      }
      console.error("Auth extension error:", error);
    }


    function expandUUID(id) {
      if (!id || typeof id !== "string" || id.trim() === "") {
        return null;
      }

      // Eğer zaten UUID formatındaysa
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )
      ) {
        return id;
      }

      // Kısaltılmışsa geri çevir
      const base64 = id
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(id.length + ((4 - (id.length % 4)) % 4), "=");

      const binary = atob(base64);
      const hex = [...binary]
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");

      return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20),
      ].join("-");
    }

    async function CreateMembership(user_id) {
      try {
        const planService = new ItemsService("plans", {
          schema: await getSchema(),
          accountability: accountability,
        });
        const membershipService = new ItemsService("memberships", {
          schema: await getSchema(),
          accountability: accountability,
        });
        const plan = await planService.readByQuery({
          filter: {
            renew_price: 0,
          },
        });

        await membershipService.createOne({
          membership_plan: plan[0].id,
          status: "1",
          start_date: new Date(),
          end_date: new Date(
            new Date().setDate(new Date().getDate() + plan[0].duration)
          ),
          period: 1,
          warning_time: new Date(
            new Date().setDate(new Date().getDate() + plan[0].duration - 3)
          ),
          finish: new Date(
            new Date().setDate(new Date().getDate() + plan[0].duration + 1)
          ),
          user: user_id,
          tokens: plan[0].token_amount,
        });
      } catch (error) {
        console.error("Error creating membership:", error);
      }
    }

    const createConfirmationMail = async (url) => {
      try {
        const templateP = path.resolve(process.cwd(), "extensions");

        const templatePath = path.join(
          templateP,
          "shortcut/confirmationMail.html"
        );

        console.log(templatePath);
        let html = fs.readFileSync(templatePath, "utf-8");
        html = html
          .replace("{{confirmation_link}}", url)
          .replace("{{year}}", new Date().getFullYear().toString());
        return html;
      } catch (error) {
        logError(error);
        console.log(error);
        return false;
      }
    };

    const sendMail = async (to, subject, html) => {
      try {
        const schema = await getSchema();
        const mailService = new MailService({
          accountability: accountability,
          schema,
        });
        const sent = await mailService.send({
          to,
          subject,
          text: "",
          html,
        });
        if (!sent) {
          logError({ msg: "No Mail Sent" });
          return false;
        }
        console.log(sent);
        return sent;
      } catch (error) {
        logError(error);
        console.log(error);
        return false;
      }
    };

    const sendConfirmationMail = async (to, url) => {
      try {
        const mailContent = await createConfirmationMail(url);
        if (!mailContent) {
          logError({ msg: "No Mail Content" });
          return false;
        }

        const mail = await sendMail(
          to,
          "Please confirm your email address",
          mailContent
        );
        if (!mail) {
          logError({ msg: "No Mail" });
          return false;
        }
        return mail;
      } catch (error) {
        logError(error);
        console.log(error);
        return false;
      }
    };

    const refreshVerifyToken = async (user) => {
      try {
        const usersService = new UsersService({
          schema: await getSchema(),
          accountability: accountability,
        });
        const newToken = uuidv4();

        const [updatedUser, sendMailResult] = await Promise.all([
          usersService.updateOne(user.id, {
            verify_token_created: new Date().toISOString(),
            verify_token: newToken,
          }),
          sendConfirmationMail(
            user.email,
            `${env.FRONTEND_URL}/confirm?t=${newToken}`
          ),
        ]);
        return { updatedUser, sendMailResult };
      } catch (error) {
        logError(error);
        console.log(error);
        return false;
      }
    };

    async function checkAvailability(plan_id, useraccountability) {
      try {
        const planService = new ItemsService("plans", {
          schema: await getSchema(),
          accountability: accountability,
        });
        const plan = await planService.readOne(plan_id);
        console.log("plan", plan);
        if (!plan) {
          return {
            success: false,
            errorCode: "PLAN_NOT_FOUND",
            errorMessage: "Plan bulunamadı.",
          };
        }
        if (plan.renew_price <= 0) {
          return {
            success: false,
            errorCode: "PLAN_IS_FREE",
            errorMessage: "Bu plan ücretsizdir.",
          };
        }
        const userServices = new UsersService({
          schema: await getSchema(),
          accountability: useraccountability,
        });

        // User'ı okuyalım
        const user = await userServices.readOne(useraccountability.user, {
          fields: ["*.*.*"],
        });

        // 1) Kullanıcı yoksa
        if (!user) {
          return {
            success: false,
            errorCode: "USER_NOT_FOUND",
            errorMessage: "Kullanıcı bulunamadı.",
          };
        }

        // 2) Kullanıcının aktif, ödenmiş bir planı var mı?
        const hasActivePaidPlan =
          user.memberships &&
          user.memberships.some(
            (membership) =>
              membership.membership_plan &&
              membership.membership_plan.renew_price > 0 &&
              membership.status === "1"
          );

        if (hasActivePaidPlan) {
          return {
            success: false,
            errorCode: "ACTIVE_PLAN_EXISTS",
            errorMessage:
              "Zaten aktif bir planınız olduğu için bu planı satın alamazsınız.",
          };
        }

        // Hiçbir hata yoksa başarı
        return {
          success: true,
        };
      } catch (error) {
        console.log("Error checking availability:", error);
        return {
          success: false,
          errorCode: "INTERNAL_ERROR",
          errorMessage: "Plan uygunluğu kontrol edilirken bir hata oluştu.",
        };
      }
    }

    async function createNewPayment(plan_id, useraccountability) {
      try {
        const userServices = new UsersService({
          schema: await getSchema(),
          accountability: useraccountability,
        });
        const planService = new ItemsService("plans", {
          schema: await getSchema(),
          accountability: useraccountability,
        });

        // 1) Plan var mı?
        const plan = await planService.readOne(plan_id);
        if (!plan) {
          return {
            success: false,
            errorCode: "PLAN_NOT_FOUND",
            errorMessage: "Plan bulunamadı.",
          };
        }

        // 2) Kullanıcı kontrolü ve gerekli alanlar var mı?
        const user = await userServices.readOne(useraccountability.user, {
          fields: ["*.*.*"],
        });
        if (
          !user ||
          !user.email ||
          !user.first_name ||
          !user.last_name ||
          !user.address ||
          !user.phone_number ||
          !user.country
        ) {
          return {
            success: false,
            errorCode: "MISSING_USER_DATA",
            errorMessage:
              "Kullanıcı bilgileri eksik. Lütfen tüm alanları doldurun.",
          };
        }

        // 3) Kullanıcının bu plana ait üyeliği (membership) var mı?
        const membership = user.memberships.find(
          (m) => m.membership_plan === plan_id
        );

        const paymentService = new ItemsService("payments", {
          schema: await getSchema(),
          accountability: accountability,
        });

        const pendingPayments = await paymentService.readByQuery({
          filter: {
            status: "0",
            user: user.id,
          },
        });
        if (pendingPayments.length > 0) {
          pendingPayments.forEach(async (payment) => {
            await paymentService.updateOne(payment.id, {
              status: "2",
            });
          });
        }

        // 4) Payment oluşturma

        let newPayment;
        if (membership) {
          // renew price üzerinden
          let price = Number(plan.renew_price);
          let user_discount = 0;
          let tax_added = 0;
          if (user.discount_rate) {
            price =
              plan.renew_price - (plan.renew_price * user.discount_rate) / 100;
          }
          user_discount = (plan.renew_price * user.discount_rate) / 100;
          if (plan.kdv && plan.kdv > 0) {
            tax_added = (price * plan.kdv) / 100;
            tax_added = Math.ceil(tax_added * 100) / 100;

            price = price + (price * plan.kdv) / 100;
            price = Math.ceil(price * 100) / 100;
          }

          newPayment = await paymentService.createOne({
            name_surname: user.first_name + " " + user.last_name,
            id_number: user.vat_number || "11111111111",
            address: user.address,
            status: "0",
            price: price,
            period: membership.period + 1,
            email: user.email,
            plan: plan.id,
            user: user.id,
            prim_paid: false,
            phone_number: user.phone_number,
            base_price: plan.renew_price,
            user_discount: user_discount,
            tax_added: tax_added,
            user_discount_rate: user.discount_rate,
            tax_rate: plan.kdv,
            country: user.country || "",
          });
        } else {
          // ilk ödeme price üzerinden
          let price = Number(plan.renew_price);
          let user_discount = 0;
          let tax_added = 0;
          if (user.discount_rate) {
            user_discount = (plan.price * user.discount_rate) / 100;
            price = plan.price - (plan.price * user.discount_rate) / 100;
          }
          if (plan.kdv && plan.kdv > 0) {
            tax_added = (price * plan.kdv) / 100;
            tax_added = Math.ceil(tax_added * 100) / 100;

            price = price + (price * plan.kdv) / 100;
            price = Math.ceil(price * 100) / 100;
          }

          newPayment = await paymentService.createOne({
            name_surname: user.first_name + " " + user.last_name,
            id_number: user.vat_number || "11111111111",
            address: user.address,
            status: "0",
            price: price,
            period: 1,
            email: user.email,
            plan: plan.id,
            user: user.id,
            prim_paid: false,
            phone_number: user.phone_number,
            base_price: plan.price,
            user_discount: user_discount,
            tax_added: tax_added,
            user_discount_rate: user.discount_rate,
            tax_rate: plan.kdv,
            country: user.country || "",
          });
        }

        // Başarılı
        return {
          success: true,
          payment: newPayment,
        };
      } catch (error) {
        console.error("Error creating new payment:", error);
        return {
          success: false,
          errorCode: "PAYMENT_CREATION_FAILED",
          errorMessage: "Ödeme işlemi oluşturulurken hata oluştu.",
        };
      }
    }

    async function checkToken(userAccountability, chat_model_id, new_chat) {
      try {
        const userServices = new UsersService({
          schema: await getSchema(),
          accountability: userAccountability,
        });

        const modelServices = new ItemsService("chat_models", {
          schema: await getSchema(),
          accountability: accountability,
        });

        const membershipService = new ItemsService("memberships", {
          schema: await getSchema(),
          accountability: userAccountability,
        });

        const plansChatModelsService = new ItemsService("plans_chat_models", {
          schema: await getSchema(),
          accountability: accountability,
        });

        const planServices = new ItemsService("plans", {
          accountability: accountability,
          schema: await getSchema(),
        });

        const adminMembershipService = new ItemsService("memberships", {
          schema: await getSchema(),
          accountability: accountability,
        });

        let chat_model;
        const user = await userServices.readOne(userAccountability.user);
        let active_membership;
        let active_plan;

        if (chat_model_id) {
          chat_model = await modelServices.readOne(chat_model_id);
        }

        const findMembership = await membershipService.readByQuery({
          filter: {
            status: "1",
          },
        });
        active_membership = findMembership[0];
        active_plan = await planServices.readOne(
          active_membership.membership_plan
        );

        if (!chat_model || !active_membership || !active_plan) {
          return false;
        }
        const findPlansChatModels = await plansChatModelsService.readByQuery({
          filter: {
            chat_models_id: chat_model_id,
            plans_id: active_plan.id,
            is_available: true,
          },
        });

        if (!findPlansChatModels || findPlansChatModels.length === 0) {
          return false;
        }

        if (active_membership.tokens < chat_model.token_per_prompt) {
          return false;
        }

        if (!new_chat) {
          await adminMembershipService.updateOne(active_membership.id, {
            tokens: active_membership.tokens - chat_model.token_per_prompt,
          });
        }

        return true;
      } catch (error) {
        console.error("Error checking token:", error);
        return false;
      }
    }

    async function subscribeToNewsletter(email) {
      try {
        const url = "https://api.sender.net/v2/subscribers";

        const headers = {
          Authorization: `Bearer ${env.SENDER_NET_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        const data = {
          email: email,
        };

        const response = await axios.post(url, data, { headers });

        // You can handle the response here if needed
        console.log("Newsletter subscription response:", response.data);

        return response.data;
      } catch (error) {
        console.log("Error subscribing to newsletter:", error);
        throw error;
      }
    }

    function base64url(input) {
      return Buffer.from(JSON.stringify(input))
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    }

    function createJWT(payload, secret) {
      const header = { alg: "HS256", typ: "JWT" };
      const encodedHeader = base64url(header);
      const encodedPayload = base64url(payload);
      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    {
      /*
      //////////////////////////////////////////////////
      //////////////////// ROUTELAR ////////////////////
      //////////////////////////////////////////////////
      */
    }

    router.post(
      "/resend-verify-token",
      protectRoute(async (req, res) => {
        const release = await resendVerifyTokenMutex.acquire();
        try {
          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: accountability,
          });

          const user = await usersService.readOne(req.accountability.user);
          if (!user) {
            return res.status(404).json({ message: "No user!" });
          }
          const resendVerify = await refreshVerifyToken(user);
          if (resendVerify) {
            return res.status(200).json({ message: "Code resent" });
          } else {
            return res.status(500).json({ message: "Unexpected error" });
          }
        } catch (error) {
          logError(error);
          console.log(error);
          return res.status(500).json({ message: "Unexpected error" });
        } finally {
          release();
        }
      })
    );

    router.post(
      "/verify-email",
      protectRoute(async (req, res) => {
        const release = await verifyEmailMutex.acquire();
        try {
          const { token } = req.body;
          if (!token) {
            return res.status(500).json({ message: 1 }); //token geçersiz
          }

          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: accountability,
          });
          const userSearch = await usersService.readByQuery({
            filter: {
              verify_token: token,
            },
          });
          const user = userSearch[0];
          if (!user) {
            return res.status(404).json({ message: 1 });
          }

          console.log(
            new Date(user.verify_token_created).getTime(),
            Date.now()
          );

          if (
            new Date(user.verify_token_created).getTime() <=
            Date.now() - 43200000
          ) {
            await refreshVerifyToken(user);
            return res.status(500).json({
              message: 2,
            });
          }

          if (user.verify_required && !user.verified) {
            const updatedUser = await usersService.updateOne(user.id, {
              verified: true,
            });
            if (updatedUser) {
              return res.status(200).json({ message: 3 });
            } else {
              return res.status(500).json({ message: 4 });
            }
          } else {
            return res.status(500).json({ message: 5 });
          }
        } catch (error) {
          console.error("Error during verifying email:", error.message);
          return res.status(500).json({ message: 4 });
        } finally {
          release();
        }
      })
    );

    router.post(
      "/google-login-credentials",
      protectRoute(async (req, res) => {
        const release = await googleLoginMutex.acquire();
        try {
          const { credential } = req.body;
          if (!credential) {
            return res.status(400).json({ error: "Credential is required." });
          }

          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: accountability,
          });

          const parts = credential.split(".");
          if (parts.length !== 3) {
            console.log("Invalid JWT format");
            return res.status(400).json({ error: "Invalid JWT format." });
          }

          // JWT decode
          const payload = parts[1];
          let decodedPayload;
          try {
            decodedPayload = JSON.parse(
              Buffer.from(payload, "base64").toString("utf8")
            );
          } catch (e) {
            return res.status(400).json({ error: "Invalid JWT payload." });
          }

          const email = decodedPayload.email;
          if (!email) {
            return res
              .status(400)
              .json({ error: "Email not found in JWT payload." });
          }

          let user = await usersService.getUserByEmail(email);
          let roleId;

          if (!user) {
            // Yeni kullanıcı oluştur
            const foundRole = await getRoleByName("user");
            if (!foundRole) {
              return res
                .status(404)
                .json({ error: "User role not found in the system." });
            }
            user = await createUser(usersService, {
              email,
              role: foundRole.id,
              first_name: decodedPayload.given_name || "",
              last_name: decodedPayload.family_name || "",
              verified: true,
              verify_required: false,
            });
            roleId = foundRole.id;
          } else {
            // Mevcut kullanıcı
            roleId = user.role || (user.role_id ? user.role_id : undefined);
          }

          // JWT payload
          const jwtPayload = {
            id: user.id || user, // createUser dönerse id, yoksa user objesi
            role: roleId,
            app_access: false,
            admin_access: false,
            iat: decodedPayload.iat,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            iss: "directus",
          };

          const jwt = createJWT(jwtPayload, env.SECRET);

          return res.status(200).json({ jwt });
        } catch (error) {
          logError(error);
          console.error("Error during Google login:", error.message);
          return res
            .status(500)
            .json({ error: "An error occurred while logging in with Google." });
        } finally {
          release();
        }
      })
    );

    router.post(
      "/google-login",
      protectRoute(async (req, res) => {
        const release = await googleLoginMutex.acquire();
        try {
          const { googleToken } = req.body;
          if (!googleToken) {
            return res
              .status(400)
              .json({ error: "Google token  are required." });
          }

          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: accountability,
          });

          const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
              headers: {
                Authorization: `Bearer ${googleToken}`,
              },
            }
          );

          const userInfo = userInfoResponse.data;

          const email = userInfo.email;
          if (!email) {
            return res
              .status(400)
              .json({ error: "Email not found in user info." });
          }

          let user = await usersService.getUserByEmail(email);
          let roleId;

          if (!user) {
            // Yeni kullanıcı oluştur
            const foundRole = await getRoleByName("user");
            if (!foundRole) {
              return res
                .status(404)
                .json({ error: "User role not found in the system." });
            }
            user = await createUser(usersService, {
              email,
              role: foundRole.id,
              first_name: userInfo.given_name || "",
              last_name: userInfo.family_name || "",
              verified: true,
              verify_required: false,
            });
            roleId = foundRole.id;
          } else {
            // Mevcut kullanıcı
            roleId = user.role || (user.role_id ? user.role_id : undefined);
          }

          // JWT payload
          const jwtPayload = {
            id: user.id || user, // createUser dönerse id, yoksa user objesi
            role: roleId,
            app_access: false,
            admin_access: false,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            iss: "directus",
          };

          const jwt = createJWT(jwtPayload, env.SECRET);

          return res.status(200).json({ jwt });
        } catch (error) {
          logError(error);
          console.error("Error during Google login:", error.message);
          return res
            .status(500)
            .json({ error: "An error occurred while logging in with Google." });
        } finally {
          release();
        }
      })
    );

    router.post(
      "/register",
      protectRoute(async (req, res) => {
        const release = await registerMutex.acquire();
        try {
          const { email, password, referral_code } = req.body || {};
          if (!email || !password) {
            return res.status(400).json({ error: "Missing required fields." });
          }

          // IP adresini al
          const clientIp =
            req.ip ||
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.headers["x-real-ip"] ||
            req.connection.remoteAddress;

          // Rate limiting kontrolü
          const rateLimitCheck = checkRegisterRateLimit(clientIp);
          if (!rateLimitCheck.allowed) {
            console.log(`Rate limit exceeded for IP: ${clientIp}`);
            return res.status(429).json({
              error: rateLimitCheck.error,
              resetTime: rateLimitCheck.resetTime,
            });
          }

          console.log(
            `Register attempt from IP: ${clientIp}, remaining: ${rateLimitCheck.remainingAttempts}`
          );

          // Email geçerlilik kontrolü
          const emailValidation = await validateRealEmail(email);
          if (!emailValidation.valid) {
            return res.status(400).json({ error: emailValidation.error });
          }

          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: accountability,
          });

          const existingUser = await usersService.getUserByEmail(email);
          if (existingUser) {
            return res
              .status(409)
              .json({ error: "This email is already in use." });
          }

          const foundRole = await getRoleByName("user");
          if (!foundRole) {
            return res
              .status(404)
              .json({ error: "User role not found in the system." });
          }

          const reffered_by = referral_code ? expandUUID(referral_code) : null;

          const verifyToken = uuidv4();

          const newUser = await createUser(usersService, {
            email,
            password,
            role: foundRole.id,
            reffered_by,
            verify_token: verifyToken,
            verify_required: true,
          });

          sendConfirmationMail(
            email,
            env.FRONTEND_URL + "/confirm?t=" + verifyToken
          );

          return res
            .status(201)
            .json({ message: "User created successfully!" });
        } catch (error) {
          console.error("Error during user creation:", error.message);
          return res
            .status(500)
            .json({ error: "An error occurred while creating the user." });
        } finally {
          release();
        }
      })
    );

    router.post(
      "/change_tfa",
      protectRoute(async (req, res) => {
        const release = await changeTfaMutex.acquire();
        try {
          const { status } = req.body;
          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: accountability,
          });
          await usersService.updateOne(req.accountability.user, {
            tfa_active: status,
          });

          return res.status(200).json({ message: "TFA durumu güncellendi." });
        } catch (error) {
          console.error("Error during TFA change:", error.message);
          return res
            .status(500)
            .json({ error: "An error occurred while changing TFA." });
        } finally {
          release();
        }
      })
    );

    router.get(
      "/user",
      protectRoute(async (req, res) => {
        const release = await userMutex.acquire();
        try {
          const usersService = new UsersService({
            schema: await getSchema(),
            accountability: req.accountability,
          });

          const user = await usersService.readOne(req.accountability.user, {
            fields: ["*"],
          });

          if (!user) {
            return res.status(404).json({ error: "User not found." });
          }

          return res.status(200).json({ user });
        } catch (error) {
          console.error("Error during user retrieval:", error.message);
          return res
            .status(500)
            .json({ error: "An error occurred while retrieving the user." });
        } finally {
          release();
        }
      })
    );
  },
};

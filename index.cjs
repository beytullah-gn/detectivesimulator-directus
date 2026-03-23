// Directus API server start
async function startDirectus() {
    try {
      // Use dynamic import to load the Directus server module
      const { startServer } = await import("@directus/api/server");
      await startServer();
      console.log("Directus server started successfully.");
    } catch (error) {
      console.error("Error starting Directus server:", error.message);
    }
  }
  
  // Start both Directus and Grammy bot
  async function main() {
    await startDirectus(); // Start Directus server
  }
  
  main();
  
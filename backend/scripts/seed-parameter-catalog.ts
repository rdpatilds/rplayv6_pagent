import { seedParameterCatalog } from "@/lib/parameter-db"

// Run the seed function
seedParameterCatalog()
  .then(() => {
    console.log("✅ Seed completed successfully.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })

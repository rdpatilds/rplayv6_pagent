import { seedParameterCatalog } from "./seed-parameter-catalog"

// Run the seed function
seedParameterCatalog()
  .then(() => {
    console.log("Parameter catalog seeded successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error seeding parameter catalog:", error)
    process.exit(1)
  })

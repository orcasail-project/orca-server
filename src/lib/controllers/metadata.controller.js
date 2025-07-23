const { getAllBoats, getAllActivities, getAllPermissions, getAllPopulationTypes, getAllRoles } = require("../storage/sql");
 
/**
 * Fetches all metadata required for application initialization.
 * This function uses smaller fetch functions and runs them in parallel.
 * @returns {Promise<Object>} An object containing arrays of boats, activities, population types, and permissions.
 */
async function fetchMetadataFromDB() {
    try {
        const [boats, activities, populationTypes, permissions, roles] = await Promise.all([
            getAllBoats(),
            getAllActivities(),
            getAllPopulationTypes(),
            getAllPermissions(),
            getAllRoles()
        ]);

        return { boats, activities, populationTypes, permissions, roles };

    } catch (error) {
        console.error("Error fetching metadata from DB:", error);
        throw error;
    }
}

const getMetadata = async (req, res) => {
    try {

        const metadata = await fetchMetadataFromDB();

        res.status(200).json(metadata);

    } catch (error) {

        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllRolesHandler = async (req, res) => {
  try {
    const roles = await getAllRole();
    res.status(200).json(roles);
  } catch (error) {
    console.error('שגיאה בשליפת roles:', error);
    res.status(500).json({ error: 'שגיאה בשרת בעת שליפת roles' });
  }
};


module.exports = {
    getMetadata,
    getAllActivities,
    getAllBoats,
    getAllRolesHandler,
    getAllPermissions,
    getAllPopulationTypes
};
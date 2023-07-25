const Product = require('../models/product')

const getAllProductsStatic = async (req, res) => {
    const products = await Product.find({}).select('name price').limit(4)
    res.status(200).json({ products, nbHits: products.length })
}

const getAllProducts = async (req, res) => {
    // Extract query parameters from the request.
    const { featured, company, name, sort, fields, numericFilters } = req.query;

    // Initialize an empty object to store the MongoDB query parameters.
    const queryObject = {};

    // Prepare the query object based on the provided parameters.

    // If 'featured' parameter is provided, convert the string to a boolean value.
    if (featured) {
        queryObject.featured = featured === 'true' ? true : false;
    }

    // If 'company' parameter is provided, add it to the query object.
    if (company) {
        queryObject.company = company;
    }

    // If 'name' parameter is provided, use a case-insensitive regex for searching by name.
    if (name) {
        queryObject.name = { $regex: name, $options: 'i' };
    }

    // If 'numericFilters' parameter is provided, parse and convert numeric filters into MongoDB operators.
    if (numericFilters) {
        const operatorMap = {
            '>': '$gt',
            '>=': '$gte',
            '=': '$eq',
            '<': '$lt',
            '<=': '$lte',
        };

        // Regular expression to match the operators.
        const regEx = /\b(<|>|>=|=|<|<=)\b/g;

        // Replace the matched operators with MongoDB operators.
        let filters = numericFilters.replace(regEx, (match) => `-${operatorMap[match]}-`);

        // List of fields that can be filtered numerically.
        const options = ['price', 'rating'];

        // Split the filters by comma and convert them into query object properties.
        filters.split(',').forEach((item) => {
            const [field, operator, value] = item.split('-');
            if (options.includes(field)) {
                queryObject[field] = { [operator]: Number(value) };
            }
        });
    }

    // Find products in the MongoDB collection based on the query object.
    let result = Product.find(queryObject);

    // Sort the products based on the 'sort' parameter, or by 'createdAt' if 'sort' is not provided.
    if (sort) {
        const sortList = sort.split(',').join(' ');
        result = result.sort(sortList);
    } else {
        result = result.sort('createdAt');
    }

    // Select specific fields if 'fields' parameter is provided.
    if (fields) {
        const fieldsList = fields.split(',').join(' ');
        result = result.select(fieldsList);
    }

    // Get the page number and limit from the query parameters or use default values.
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // Calculate the number of items to skip for pagination.
    const skip = (page - 1) * limit;

    // Apply pagination to the result.
    result = result.skip(skip).limit(limit);

    // Execute the MongoDB query and store the result in 'products'.
    const products = await result;

    // Send the final list of products as a response along with the number of hits.
    res.status(200).json({ products, nbHits: products.length });
};


module.exports = {
    getAllProducts,
    getAllProductsStatic
}
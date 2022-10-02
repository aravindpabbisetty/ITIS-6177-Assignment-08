const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cacheService = require("express-api-cache");
const { check, validationResult } = require("express-validator");
const swaggerUI = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
const PORT = 3000;

let cache = cacheService.cache;

const mariadb = require("mariadb");
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  database: "sample",
  port: 3306,
  connectionLimit: 5,
});

const swaggerDetails = {
  swaggerDefinition: {
    info: {
      title: "ITIS 6177 Assignment 08",
      version: "1.0.0",
      description:
        "Automatic generation of documentation for apis using swagger",
    },
    host: "localhost:3000",
    basePath: "/",
  },
  apis: ["./index.js"],
};

const swaggerSpecs = swaggerJsdoc(swaggerDetails);

app.use("/apidocs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

/**
 * @swagger
 * /daysorder:
 *     get:
 *       description: Return all order details
 *       produces:
 *          - application/json
 *       responses:
 *          200:
 *              description: JSON object of all orders details on a day
 *          400:
 *              description: error due to invalid request
 */

app.get("/daysorder", cache("10 minutes"), async (req, res) => {
  try {
    const query = "SELECT * FROM daysorder";
    const rows = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /foods:
 *     get:
 *       description: Return all food details
 *       produces:
 *          - application/json
 *       responses:
 *          200:
 *              description: JSON object of all food details
 *          400:
 *              description: error due to invalid request
 */
app.get("/foods", cache("10 minutes"), async (req, res) => {
  try {
    const query = "SELECT * FROM foods";
    const rows = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /companies:
 *     get:
 *       description: Return all company details
 *       produces:
 *          - application/json
 *       responses:
 *          200:
 *              description: JSON object of all company details
 *          400:
 *              description: error due to invalid request
 */
app.get("/companies", cache("10 minutes"), async (req, res) => {
  try {
    const query = "SELECT * FROM company";
    const rows = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

/**
 * @swagger
 * /listofitem:
 *  post:
 *    description: Inserts a new item record
 *    consumes:
 *    - application/json
 *    produces:
 *    - application/json
 *    parameters:
 *    - in: body
 *      name: itemdetails
 *      required: true
 *      schema:
 *        type: string
 *        $ref: "#/definitions/itemDefs"
 *    requestBody:
 *      request: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: "#definitions/itemDefs"
 *    responses:
 *      200:
 *       description: A successfull insertion of the record
 *      201:
 *       description: A unsuccessful insertion of the record
 *      400:
 *       description: A invalid request
 * definitions:
 *   itemDefs:
 *     type: object
 *     required:
 *     - itemcode
 *     - itemname
 *     - batchcode
 *     - companyname
 *     properties:
 *       itemcode:
 *         type: string
 *         example: I003
 *       itemname:
 *         type: string
 *         example: Hot Dog
 *       batchcode:
 *         type: string
 *         example: DM/2007-08/WBM%1
 *       companyname:
 *         type: string
 *         example: ABJ ENTERPRISE
 */
app.post("/listofitem",check("itemcode").isLength({max: 6}).withMessage("item code must have maximum of 6 characters").not().isEmpty().trim(),
  check("itemname").isLength({max: 25}).withMessage("Item name must have max length of 25").not().isEmpty().trim(),
  check("batchcode").isLength({max: 35}).withMessage("batch code should have max length of 35").not().isEmpty().trim(),
  check("companyname").isLength({max: 35}).withMessage("company name should have max length of 35").not().isEmpty().trim(),
  async (req, res) => {
    let itemcode = req.body.itemcode;
    let itemname = req.body.itemname;
    let batchcode = req.body.batchcode;
    let companyname = req.body.coname;
		const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
			return res.status(400).json({  
				validationErrors: validationErrors.array()
			});
    }

    try {
      const result = await pool.query(
        `INSERT INTO listofitem VALUES ('${itemcode}', '${itemname}', '${batchcode}', '${companyname}')`
      );
      res.setHeader("Content-Type", "Application/json");
      if (result.affectedRows > 0) {
        res.statusCode = 200;
        res.send(
          `Insertion Successful inserted ${result.affectedRows} records`
        );
      } else {
        res.statusCode = 201;
        res.send("Insertion Unsuccessful no records were inserted");
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

/**
 * @swagger
 * /patch/foods:
 *  patch:
 *    description: Updates a record and if no record is present it inserts that record
 *    consumes:
 *    - application/json
 *    produces:
 *    - application/json
 *    parameters:
 *    - in: body
 *      name: itemdetails
 *      required: true
 *      schema:
 *        type: string
 *        $ref: "#/definitions/foodItemDefs"
 *    requestBody:
 *      request: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: "#definitions/foodItemDefs"
 *    responses:
 *      200:
 *       description: A successfull updation or insertion of the record
 *      201:
 *       description: A unsuccessful update or insertion of the record
 *      400:
 *       description: A invalid request
 * definitions:
 *   foodItemDefs:
 *     type: object
 *     required:
 *     - itemId
 *     - itemName
 *     - itemUnit
 *     - companyId
 *     properties:
 *       itemId:
 *         type: string
 *         example: '4'
 *       itemName:
 *         type: string
 *         example: Cheez-It
 *       itemUnit:
 *         type: string
 *         example: Pcs
 *       companyId:
 *         type: string
 *         example: '75'
 */
app.patch("/patch/foods",
	check("itemId").isLength({max: 6}).withMessage("item id must have maximum of 6 characters").not().isEmpty().trim(),
	check("itemName").isLength({max: 25}).withMessage("item name must have max length of 25").not().isEmpty().trim(),
	check("itemUnit").isLength({max: 5}).withMessage("item unit should have max length of 5").not().isEmpty().trim(),
	check("companyId").isLength({max: 6}).withMessage("company id should have max length of 6").not().isEmpty().trim(), 
	async (req, res) => {
		let itemId = req.body.itemId;
		let itemName = req.body.itemName;
		let itemUnit = req.body.itemUnit;
		let companyId = req.body.companyId;

		const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
			return res.status(400).json({  
				validationErrors: validationErrors.array()
			});
    }

		try {
			const updateresult = await pool.query(
				`update foods set item_id = '${itemId}', item_name = '${itemName}', item_unit = '${itemUnit}', company_id = '${companyId}' where item_id = '${itemId}'`
			);
			res.setHeader("Content-Type", "Application/json");
			if (updateresult.affectedRows > 0) {
				res.statusCode = 200;
				res.send(
					`Updation Successful updated ${updateresult.affectedRows} records`
				);
			} else {
				const inserresult = await pool.query(
					`insert into foods values('${itemId}','${itemName}','${itemUnit}','${companyId}')`
				);
				if (inserresult.affectedRows > 0) {
					res.statusCode = 200;
					res.send(
						`Insertion Successful inserted ${inserresult.affectedRows} records`
					);
				} else {
					res.statusCode = 201;
					res.send("patch  request unsuccessful no records were inserted or updated");
				}
			}
		} catch (error) {
			res.status(400).send(error);
		}
	}
);

/**
 * @swagger
 * /put/foods:
 *  put:
 *    description: Updates a food record
 *    consumes:
 *    - application/json
 *    produces:
 *    - application/json
 *    parameters:
 *    - in: body
 *      name: itemdetails
 *      required: true
 *      schema:
 *        type: string
 *        $ref: "#/definitions/foodItemDefs"
 *    requestBody:
 *      request: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: "#definitions/foodItemDefs"
 *    responses:
 *      200:
 *       description: A successfull updation of the record
 *      201:
 *       description: A unsuccessful update of the record
 *      400:
 *       description: A invalid request
 * definitions:
 *   foodItemDefs:
 *     type: object
 *     required:
 *     - itemId
 *     - itemName
 *     - itemUnit
 *     - companyId
 *     properties:
 *       itemId:
 *         type: string
 *         example: '4'
 *       itemName:
 *         type: string
 *         example: Cheez-It
 *       itemUnit:
 *         type: string
 *         example: Pcs
 *       companyId:
 *         type: string
 *         example: '75'
 */
app.put("/put/foods",
	check("itemId").isLength({max: 6}).withMessage("item id must have maximum of 6 characters").not().isEmpty().trim(),
	check("itemName").isLength({max: 25}).withMessage("item name must have max length of 25").not().isEmpty().trim(),
	check("itemUnit").isLength({max: 5}).withMessage("item unit should have max length of 5").not().isEmpty().trim(),
	check("companyId").isLength({max: 6}).withMessage("company id should have max length of 6").not().isEmpty().trim(), 
	
	async (req, res) => {

		let itemId = req.body.itemId;
		let itemName = req.body.itemName;
		let itemUnit = req.body.itemUnit;
		let companyId = req.body.companyId;

		const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
			return res.status(400).json({  
				validationErrors: validationErrors.array()
			});
    }

		try {
			const updateresult = await pool.query(
				`update foods set item_id = '${itemId}', item_name = '${itemName}', item_unit = '${itemUnit}', company_id = '${companyId}' where item_id = '${itemId}'`
			);
			res.setHeader("Content-Type", "Application/json");
			if (updateresult.affectedRows > 0) {
				res.statusCode = 200;
				res.send(
					`Updation Successful updated ${updateresult.affectedRows} records`
				);
			} else {
				res.statusCode = 201;
				res.send(
					`Updation unsuccessful record with itemID ${itemId} is not found`
				);
			}
		} catch (error) {
			res.status(400).send(error);
		}
	}
);


/**
 * @swagger
 * /delete/foods/{id}:
 *  delete:
 *   description: delete record from company table
 *   parameters:
 *    - in: path
 *      name: id
 *      schema:
 *       type: String
 *      required: true
 *      description: id of the food item record
 *      example: '4'
 *   responses:
 *      200:
 *       description: A successfull updation of the record
 *      201:
 *       description: A unsuccessful update of the record
 *      400:
 *       description: A invalid request
 */
app.delete("/delete/foods/:id",check('id').isLength({max: 6}).withMessage('id should have max length of 6').not().isEmpty().trim(), 
	async (req, res) => {

		let id = req.params.id;

		const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
			return res.status(400).json({  
				validationErrors: validationErrors.array()
			});
    }
	
		try {
			const result = await pool.query(
				`delete from foods where item_id = ('${id}')`
			);
			if (result.affectedRows > 0) {
				res.statusCode = 200;
				res.send(`Deletion successful record with item id ${id} is deleted`);
			} else {
				res.statusCode = 201;
				res.send(`Deletion usuccessful record with item id ${id} is not found`);
			}
		} catch (error) {
			res.status(400).send(error);
		}
	}
);

app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is Successfully running,and App is listening on port " + PORT
    );
  } else {
    console.log("Error occurred, server can't start", error);
  }
});

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Database and server connected successfully");
    });
  } catch (e) {
    console.log(`db error:${e.message}`);
  }
};
initializeDbAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const allStatesQuery = `SELECT * FROM state;`;
  const allStateArray = await db.all(allStatesQuery);
  function getReqObj(item) {
    return {
      stateId: item.state_id,
      stateName: item.state_name,
      population: item.population,
    };
  }
  let resultArray = allStateArray.map(getReqObj);
  response.send(resultArray);
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateWithIdQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const state = await db.get(stateWithIdQuery);
  function getReqObj(item) {
    return {
      stateId: item.state_id,
      stateName: item.state_name,
      population: item.population,
    };
  }
  let resultArray = getReqObj(state);
  response.send(resultArray);
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `INSERT INTO 
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES 
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtWithIdQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const district = await db.get(districtWithIdQuery);
  function getReqObj(item) {
    return {
      districtId: item.district_id,
      districtName: item.district_name,
      stateId: item.state_id,
      cases: item.cases,
      cured: item.cured,
      active: item.active,
      deaths: item.deaths,
    };
  }
  let resultArray = getReqObj(district);
  response.send(resultArray);
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdDeleteQuery = `
    DELETE FROM 
    district 
    WHERE
     district_id=${districtId};
    `;
  await db.run(districtIdDeleteQuery);
  response.send("District Removed");
});

//API  6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const changeDetailsQuery = `UPDATE district
    SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE 
    district_id=${districtId};
    `;
  await db.run(changeDetailsQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalByStateIdQuery = `SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM
     district
   
    WHERE 
    state_id=${stateId};`;
  let resultObj = await db.get(getTotalByStateIdQuery);

  /*response.send({
    totalCases: resultObj["sum(cases)"],
    totalCured: resultObj["sum(cured)"],
    totalActive: resultObj["sum(Active)"],
    totalDeaths: resultObj["sum(deaths)"],
  });*/
  response.send(resultObj);
});

//API  8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameFromIdQuery = `
    SELECT state.state_name AS stateName
    FROM 
    state INNER JOIN district ON  state.state_id=district.state_id
    WHERE 
    district.district_id=${districtId}
    ;`;
  const resultArray = await db.all(stateNameFromIdQuery);
  response.send({
    stateName: resultArray[0].stateName,
  });
});
module.exports = app;

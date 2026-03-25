use("autoRepair")

printjson(
  db.repairs.countDocuments({ "viatura.marca": "Cadillac" })
)

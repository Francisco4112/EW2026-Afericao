use("autoRepair")

printjson(
  db.repairs.distinct("viatura.marca").sort()
)

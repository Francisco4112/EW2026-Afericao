use("autoRepair")

printjson(
  db.repairs.aggregate([
    { $unwind: "$intervencoes" },
    {
      $group: {
        _id: {
          codigo: "$intervencoes.codigo",
          nome: "$intervencoes.nome",
          descricao: "$intervencoes.descricao"
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { "_id.codigo": 1 } }
  ]).toArray()
)

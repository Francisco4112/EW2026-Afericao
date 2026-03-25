use("autoRepair");

printjson(
  db.repairs
    .aggregate([
      {
        $project: {
          ano: { $substrBytes: ["$data", 0, 4] },
          nif: "$nif",
        },
      },
      {
        $group: {
          _id: "$ano",
          clientes: { $addToSet: "$nif" },
        },
      },
      {
        $project: {
          _id: 0,
          ano: "$_id",
          total_clientes: { $size: "$clientes" },
        },
      },
      { $sort: { ano: 1 } },
    ])
    .toArray(),
);

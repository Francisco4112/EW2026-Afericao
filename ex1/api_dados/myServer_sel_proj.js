const express = require("express");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 16025;
const dbName = "autoRepair";
const collectionName = "repairs";
const mongoUrl = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${dbName}`;

app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString().substring(0, 19);
  console.log(`${req.method} ${req.originalUrl} ${timestamp}`);
  next();
});

mongoose
  .connect(mongoUrl)
  .then(() => console.log(`MongoDB ligado a ${mongoUrl}`))
  .catch((err) => console.error("Erro na ligacao ao MongoDB:", err));

const repairSchema = new mongoose.Schema(
  {
    nome: String,
    nif: Number,
    data: String,
    viatura: {
      marca: String,
      modelo: String,
      matricula: String,
    },
    nr_intervencoes: Number,
    intervencoes: [
      {
        codigo: String,
        nome: String,
        descricao: String,
      },
    ],
  },
  { collection: collectionName, versionKey: false, strict: false },
);

const Repair = mongoose.model("Repair", repairSchema);

function buildRepairFilter(query) {
  const filter = {};

  if (query.ano) {
    filter.data = new RegExp(`^${query.ano}-`);
  }

  if (query.marca) {
    filter["viatura.marca"] = query.marca;
  }

  return filter;
}

async function listMatriculas(req, res) {
  try {
    const matriculas = await Repair.distinct("viatura.matricula");
    res.json(matriculas.sort((a, b) => a.localeCompare(b, "pt")));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

app.get("/repairs/matriculas", listMatriculas);
app.get("/repairs/matrículas", listMatriculas);
app.get(/^\/repairs\/matr(?:iculas|%C3%ADculas)$/, listMatriculas);

app.get("/repairs/interv", async (req, res) => {
  try {
    const intervencoes = await Repair.aggregate([
      { $unwind: "$intervencoes" },
      {
        $group: {
          _id: {
            codigo: "$intervencoes.codigo",
            nome: "$intervencoes.nome",
            descricao: "$intervencoes.descricao",
          },
        },
      },
      { $sort: { "_id.codigo": 1 } },
      {
        $project: {
          _id: 0,
          codigo: "$_id.codigo",
          nome: "$_id.nome",
          descricao: "$_id.descricao",
        },
      },
    ]);

    res.json(intervencoes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/repairs/:id", async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id).lean();

    if (!repair) {
      return res.status(404).json({ error: "Registo nao encontrado." });
    }

    res.json(repair);
  } catch (err) {
    res.status(400).json({ error: "Identificador invalido." });
  }
});

app.get("/repairs", async (req, res) => {
  try {
    const filter = buildRepairFilter(req.query);
    const repairs = await Repair.find(filter).sort({ data: 1, _id: 1 }).lean();
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/repairs", async (req, res) => {
  try {
    const repair = new Repair(req.body);
    const savedRepair = await repair.save();
    res.status(201).json(savedRepair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/repairs/:id", async (req, res) => {
  try {
    const deletedRepair = await Repair.findByIdAndDelete(req.params.id).lean();

    if (!deletedRepair) {
      return res.status(404).json({ error: "Registo nao encontrado." });
    }

    res.json(deletedRepair);
  } catch (err) {
    res.status(400).json({ error: "Identificador invalido." });
  }
});

app.listen(port, () => {
  console.log(`API de dados disponivel em http://localhost:${port}/repairs`);
});

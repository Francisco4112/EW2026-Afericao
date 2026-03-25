const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 16026;
const apiBaseUrl = process.env.API_URL || "http://localhost:16025/repairs";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

function now() {
  return new Date().toISOString().substring(0, 19);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }

  return response.json();
}

function normalizeRepairs(repairs) {
  return repairs.map((repair) => ({
    ...repair,
    detailUrl: `/${encodeURIComponent(repair._id)}`,
    brandUrl: `/${encodeURIComponent(repair.viatura.marca)}`,
  }));
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} ${now()}`);
  next();
});

app.get("/", async (req, res) => {
  try {
    const repairs = normalizeRepairs(await fetchJson(apiBaseUrl));

    res.render("index", {
      title: "Reparacoes",
      date: now(),
      repairs,
    });
  } catch (err) {
    res.status(500).render("error", {
      title: "Erro",
      message: "Erro ao obter a lista de reparacoes da API.",
      error: err.message,
    });
  }
});

app.get("/:token", async (req, res) => {
  const token = decodeURIComponent(req.params.token);

  try {
    if (/^[0-9a-fA-F]{24}$/.test(token)) {
      const repair = await fetchJson(`${apiBaseUrl}/${token}`);

      return res.render("repair", {
        title: `Registo ${repair._id}`,
        date: now(),
        repair,
      });
    }

    const repairs = normalizeRepairs(
      await fetchJson(`${apiBaseUrl}?marca=${encodeURIComponent(token)}`),
    );

    if (repairs.length === 0) {
      return res.status(404).render("error", {
        title: "Marca nao encontrada",
        message: `Nao existem reparacoes para a marca ${token}.`,
        error: "",
      });
    }

    const models = [
      ...new Set(repairs.map((repair) => repair.viatura.modelo)),
    ].sort((a, b) => a.localeCompare(b, "pt"));

    return res.render("brand", {
      title: `Marca ${token}`,
      date: now(),
      brand: token,
      models,
      repairs,
    });
  } catch (err) {
    const status = /API 404/.test(err.message) ? 404 : 500;
    res.status(status).render("error", {
      title: status === 404 ? "Registo nao encontrado" : "Erro",
      message:
        status === 404
          ? `Nao foi encontrado nenhum registo para ${token}.`
          : "Erro ao obter dados da API.",
      error: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Interface disponivel em http://localhost:${port}`);
});

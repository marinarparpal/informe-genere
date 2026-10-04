import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import logoEntitat from "./Assets/logo.png";

// ---------------------------------------------------------------------------
// Configuració
// ---------------------------------------------------------------------------

const GRUPS = ["homes", "altres"];
const NOMS = { homes: "Homes", altres: "Dones/NB" };
const COLORS = { homes: "#008A45", altres: "#B72446" };

// Les dades es desen al mateix navegador (sense servidor) perquè no es perdin
// si es recarrega la pàgina per error.
const CLAU_DESAT = "informe-genere-v2";

const estatInicial = {
  presents: { homes: "", altres: "" },
  stats: {
    homes: { intervencions: 0, segons: 0 },
    altres: { intervencions: 0, segons: 0 },
  },
  actiu: null, // "homes" | "altres" | null
  inici: null, // marca de temps (ms) de la intervenció en curs
};

const carregarEstat = () => {
  try {
    const desat = window.localStorage.getItem(CLAU_DESAT);
    if (!desat) return estatInicial;
    const dades = JSON.parse(desat);
    return { ...estatInicial, ...dades };
  } catch (e) {
    return estatInicial;
  }
};

// ---------------------------------------------------------------------------
// Utilitats de format
// ---------------------------------------------------------------------------

const formatTime = (segons) => {
  const s = Math.max(0, Math.round(segons));
  const hores = Math.floor(s / 3600);
  const minuts = Math.floor((s % 3600) / 60);
  const resta = s % 60;
  let text = "";
  if (hores > 0) text += `${hores}h `;
  if (minuts > 0 || hores > 0) text += `${minuts}m `;
  text += `${resta}s`;
  return text;
};

const formatNum = (n) =>
  n.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPct = (n) => `${Math.round(n)}%`;

const pct = (part, total) => (total > 0 ? (part / total) * 100 : 0);

const avui = () => new Date().toLocaleDateString("ca-ES");

// ---------------------------------------------------------------------------
// Aplicació
// ---------------------------------------------------------------------------

const App = () => {
  const [estat, setEstat] = useState(carregarEstat);
  const [ara, setAra] = useState(Date.now());
  const [missatgeCopia, setMissatgeCopia] = useState("");

  const { presents, stats, actiu, inici } = estat;

  // Desem cada canvi al navegador
  useEffect(() => {
    try {
      window.localStorage.setItem(CLAU_DESAT, JSON.stringify(estat));
    } catch (e) {
      // Si el navegador no permet desar (mode privat, etc.), seguim igualment
    }
  }, [estat]);

  // Actualitzem el rellotge cada segon mentre hi ha una intervenció en curs
  useEffect(() => {
    if (!actiu) return undefined;
    setAra(Date.now());
    const interval = setInterval(() => setAra(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [actiu]);

  // ---- Accions -------------------------------------------------------------

  const segonsEnCurs = () =>
    actiu && inici ? Math.max(0, Math.floor((ara - inici) / 1000)) : 0;

  const handleIntervencio = (grup) => {
    const moment = Date.now();
    setEstat((prev) => {
      const nousStats = { ...prev.stats };

      // Si hi ha una intervenció en curs, la tanquem i en sumem el temps
      if (prev.actiu) {
        const durada = Math.max(0, Math.floor((moment - prev.inici) / 1000));
        nousStats[prev.actiu] = {
          ...nousStats[prev.actiu],
          segons: nousStats[prev.actiu].segons + durada,
        };
      }

      // Si s'ha premut el botó del grup que parlava, només finalitzem
      if (prev.actiu === grup) {
        return { ...prev, stats: nousStats, actiu: null, inici: null };
      }

      // Si no, comencem una intervenció nova d'aquest grup
      nousStats[grup] = {
        ...nousStats[grup],
        intervencions: nousStats[grup].intervencions + 1,
      };
      return { ...prev, stats: nousStats, actiu: grup, inici: moment };
    });
    setAra(moment);
  };

  // Anul·la la intervenció en curs (per si s'ha premut el botó equivocat)
  const handleCancel = () => {
    setEstat((prev) => {
      if (!prev.actiu) return prev;
      const nousStats = { ...prev.stats };
      nousStats[prev.actiu] = {
        ...nousStats[prev.actiu],
        intervencions: Math.max(0, nousStats[prev.actiu].intervencions - 1),
      };
      return { ...prev, stats: nousStats, actiu: null, inici: null };
    });
  };

  const handlePresents = (grup, valor) => {
    const net = valor.replace(/[^0-9]/g, "");
    setEstat((prev) => ({
      ...prev,
      presents: { ...prev.presents, [grup]: net },
    }));
  };

  const handleReinicia = () => {
    if (
      window.confirm(
        "Segur que vols esborrar totes les dades i començar una activitat nova?"
      )
    ) {
      setEstat(estatInicial);
      setMissatgeCopia("");
    }
  };

  // ---- Càlculs -------------------------------------------------------------

  const tempsTotal = (grup) =>
    stats[grup].segons +
    (actiu === grup && inici ? Math.max(0, Math.floor((ara - inici) / 1000)) : 0);

  const dades = {};
  GRUPS.forEach((g) => {
    dades[g] = {
      presents: parseInt(presents[g], 10) || 0,
      intervencions: stats[g].intervencions,
      segons: tempsTotal(g),
    };
  });

  const totalPresents = dades.homes.presents + dades.altres.presents;
  const totalIntervencions = dades.homes.intervencions + dades.altres.intervencions;
  const totalSegons = dades.homes.segons + dades.altres.segons;
  const hiHaPresents = dades.homes.presents > 0 && dades.altres.presents > 0;

  GRUPS.forEach((g) => {
    const d = dades[g];
    d.pctPresencia = pct(d.presents, totalPresents);
    d.pctIntervencions = pct(d.intervencions, totalIntervencions);
    d.pctTemps = pct(d.segons, totalSegons);
    d.duradaMitjana = d.intervencions > 0 ? d.segons / d.intervencions : 0;
    d.tempsPerPersona = d.presents > 0 ? d.segons / d.presents : 0;
    d.intervPerPersona = d.presents > 0 ? d.intervencions / d.presents : 0;
    d.index = d.pctPresencia > 0 && totalSegons > 0 ? d.pctTemps / d.pctPresencia : null;
  });

  // Frase de conclusió: quantes vegades parla més (per persona) un grup que l'altre
  const conclusio = () => {
    if (!hiHaPresents) return null;
    if (totalSegons === 0) return null;
    const h = dades.homes.tempsPerPersona;
    const a = dades.altres.tempsPerPersona;
    if (a === 0) return "Les dones/NB no han intervingut.";
    if (h === 0) return "Els homes no han intervingut.";
    const ratio = h / a;
    if (Math.abs(ratio - 1) < 0.005) {
      return "Per persona, homes i dones/NB han parlat el mateix temps.";
    }
    if (ratio > 1) {
      return `Per persona, els homes han parlat ${formatNum(ratio)} vegades el temps de les dones/NB.`;
    }
    return `Per persona, les dones/NB han parlat ${formatNum(1 / ratio)} vegades el temps dels homes.`;
  };

  // ---- Resum per a l'acta --------------------------------------------------

  const textResum = () => {
    const h = dades.homes;
    const a = dades.altres;
    const linies = [`Informe de gènere – ${avui()}`];

    if (hiHaPresents) {
      linies.push(
        `Persones presents: ${h.presents} homes i ${a.presents} dones/NB (${formatPct(h.pctPresencia)} / ${formatPct(a.pctPresencia)})`
      );
    }
    linies.push(
      `Intervencions: homes ${h.intervencions} (${formatPct(h.pctIntervencions)}), dones/NB ${a.intervencions} (${formatPct(a.pctIntervencions)})`
    );
    linies.push(
      `Temps de paraula: homes ${formatTime(h.segons)} (${formatPct(h.pctTemps)}), dones/NB ${formatTime(a.segons)} (${formatPct(a.pctTemps)})`
    );
    linies.push(
      `Durada mitjana per intervenció: homes ${formatTime(h.duradaMitjana)}, dones/NB ${formatTime(a.duradaMitjana)}`
    );
    if (hiHaPresents) {
      linies.push(
        `Temps per persona: homes ${formatTime(h.tempsPerPersona)}, dones/NB ${formatTime(a.tempsPerPersona)}`
      );
      if (h.index !== null && a.index !== null) {
        linies.push(
          `Índex de participació (temps): homes ${formatNum(h.index)}, dones/NB ${formatNum(a.index)} (1 = proporcional a la presència)`
        );
      }
      const c = conclusio();
      if (c) linies.push(c);
    }
    return linies.join("\n");
  };

  const handleCopia = async () => {
    const text = textResum();
    try {
      await navigator.clipboard.writeText(text);
      setMissatgeCopia("Resum copiat! Ja el pots enganxar a l'acta.");
    } catch (e) {
      // Alternativa per a navegadors antics
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        setMissatgeCopia("Resum copiat! Ja el pots enganxar a l'acta.");
      } catch (err) {
        setMissatgeCopia("No s'ha pogut copiar. Selecciona el text del resum i copia'l a mà.");
      }
      document.body.removeChild(area);
    }
    setTimeout(() => setMissatgeCopia(""), 4000);
  };

  // ---- Gràfics -------------------------------------------------------------

  // (és una funció normal, no un component, perquè no es redibuixi de zero cada segon)
  const renderGrafic = (titol, camp, total) => {
    const dadesGrafic = GRUPS.map((g) => ({
      name: NOMS[g],
      value: dades[g][camp],
      grup: g,
    }));
    return (
      <div className="grafic">
        <h3>{titol}</h3>
        {total === 0 ? (
          <div className="grafic-buit">Encara no hi ha dades</div>
        ) : (
          <div className="grafic-cos">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dadesGrafic}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={dadesGrafic.every((d) => d.value > 0) ? 5 : 0}
                  dataKey="value"
                  animationDuration={300}
                  animationBegin={0}
                >
                  {dadesGrafic.map((d) => (
                    <Cell key={d.grup} fill={COLORS[d.grup]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value, entry) =>
                    `${value} (${formatPct(pct(entry.payload.value, total))})`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const c = conclusio();

  // ---- Interfície ----------------------------------------------------------

  return (
    <div className="app">
      <h1>Informe de gènere</h1>

      {/* Persones presents */}
      <section className="targeta">
        <h2>Persones presents</h2>
        <div className="fila">
          {GRUPS.map((g) => (
            <label key={g} className="camp">
              <span>{NOMS[g]}</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={presents[g]}
                onChange={(e) => handlePresents(g, e.target.value)}
              />
            </label>
          ))}
        </div>
        {!hiHaPresents && (
          <p className="ajuda">
            Indica quantes persones de cada grup hi ha per poder comparar la
            participació de manera proporcional.
          </p>
        )}
      </section>

      {/* Botons d'intervenció */}
      <div className="fila">
        {GRUPS.map((g) => (
          <section key={g} className="targeta grup">
            <h2>{NOMS[g]}</h2>
            <button
              className="boto-intervencio"
              style={{ backgroundColor: actiu === g ? "#B72446" : "#008A45" }}
              onClick={() => handleIntervencio(g)}
            >
              {actiu === g
                ? `Finalitzar intervenció · ${formatTime(segonsEnCurs())}`
                : "Intervenció" +
                  (stats[g].intervencions > 0 ? ` (${stats[g].intervencions})` : "")}
            </button>
            {actiu === g && (
              <button className="boto-enllac" onClick={handleCancel}>
                M'he equivocat: anul·la aquesta intervenció
              </button>
            )}
            <div className="temps-total">
              Temps total: {formatTime(dades[g].segons)}
            </div>
          </section>
        ))}
      </div>

      {/* Gràfics */}
      <div className="fila">
        {renderGrafic("Distribució d'intervencions", "intervencions", totalIntervencions)}
        {renderGrafic("Distribució de temps", "segons", totalSegons)}
      </div>

      {/* Resultats proporcionals */}
      <section className="targeta">
        <h2>Resultats</h2>
        <div className="taula-contenidor">
          <table className="taula">
            <thead>
              <tr>
                <th></th>
                <th>Homes</th>
                <th>Dones/NB</th>
              </tr>
            </thead>
            <tbody>
              {hiHaPresents && (
                <tr>
                  <td>Presència a la sala</td>
                  <td>{dades.homes.presents} ({formatPct(dades.homes.pctPresencia)})</td>
                  <td>{dades.altres.presents} ({formatPct(dades.altres.pctPresencia)})</td>
                </tr>
              )}
              <tr>
                <td>Intervencions</td>
                <td>{dades.homes.intervencions} ({formatPct(dades.homes.pctIntervencions)})</td>
                <td>{dades.altres.intervencions} ({formatPct(dades.altres.pctIntervencions)})</td>
              </tr>
              <tr>
                <td>Temps de paraula</td>
                <td>{formatTime(dades.homes.segons)} ({formatPct(dades.homes.pctTemps)})</td>
                <td>{formatTime(dades.altres.segons)} ({formatPct(dades.altres.pctTemps)})</td>
              </tr>
              <tr>
                <td>Durada mitjana per intervenció</td>
                <td>{formatTime(dades.homes.duradaMitjana)}</td>
                <td>{formatTime(dades.altres.duradaMitjana)}</td>
              </tr>
              {hiHaPresents && (
                <>
                  <tr>
                    <td>Intervencions per persona</td>
                    <td>{formatNum(dades.homes.intervPerPersona)}</td>
                    <td>{formatNum(dades.altres.intervPerPersona)}</td>
                  </tr>
                  <tr>
                    <td>Temps per persona</td>
                    <td>{formatTime(dades.homes.tempsPerPersona)}</td>
                    <td>{formatTime(dades.altres.tempsPerPersona)}</td>
                  </tr>
                  <tr>
                    <td>
                      Índex de participació (temps)
                      <span className="nota">1 = proporcional a la presència</span>
                    </td>
                    <td>{dades.homes.index !== null ? formatNum(dades.homes.index) : "–"}</td>
                    <td>{dades.altres.index !== null ? formatNum(dades.altres.index) : "–"}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {c && <p className="conclusio">{c}</p>}
      </section>

      {/* Resum per a l'acta */}
      <section className="targeta">
        <h2>Resum per a l'acta</h2>
        <pre className="resum">{textResum()}</pre>
        <div className="accions">
          <button className="boto boto-principal" onClick={handleCopia}>
            Copia el resum
          </button>
          <button className="boto boto-secundari" onClick={handleReinicia}>
            Reinicia (activitat nova)
          </button>
        </div>
        {missatgeCopia && <p className="missatge">{missatgeCopia}</p>}
      </section>

      <footer className="peu">
        <img src={logoEntitat} alt="Logo de l'entitat" />
      </footer>
    </div>
  );
};

export default App;

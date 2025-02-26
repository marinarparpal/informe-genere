import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
// Importem el logo (assumim que el fitxer es diu logo.png i està a la carpeta Assets)
import logoEntitat from './Assets/logo.png';

const App = () => {
  const [stats, setStats] = useState({
    homes: { intervencions: 0, segons: 0 },
    altres: { intervencions: 0, segons: 0 },
  });

  const [timerActive, setTimerActive] = useState({
    homes: false,
    altres: false,
  });

  const [startTime, setStartTime] = useState({
    homes: null,
    altres: null,
  });

  const [currentTime, setCurrentTime] = useState({
    homes: 0,
    altres: 0,
  });

  // Per detectar la mida de la pantalla
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    // Funció per actualitzar l'estat segons la mida de la pantalla
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    // Afegim listener per quan canvia la mida de la finestra
    window.addEventListener('resize', handleResize);

    // Netegem listener quan es desmunta el component
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reduïm la freqüència d'actualització del temporitzador
  useEffect(() => {
    let interval;
    if (timerActive.homes || timerActive.altres) {
      interval = setInterval(() => {
        const now = Date.now();

        if (timerActive.homes) {
          const segonsHomes = Math.floor((now - startTime.homes) / 1000);
          setCurrentTime((prev) => {
            // Només actualitzem si canvia el valor
            if (prev.homes !== segonsHomes) {
              return { ...prev, homes: segonsHomes };
            }
            return prev;
          });
        }

        if (timerActive.altres) {
          const segonsAltres = Math.floor((now - startTime.altres) / 1000);
          setCurrentTime((prev) => {
            // Només actualitzem si canvia el valor
            if (prev.altres !== segonsAltres) {
              return { ...prev, altres: segonsAltres };
            }
            return prev;
          });
        }
      }, 1000); // Actualitzem cada segon, però només si cal
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, startTime]);

  const formatTime = (segons) => {
    const hours = Math.floor(segons / 3600);
    const minutes = Math.floor((segons % 3600) / 60);
    const remainingSeconds = segons % 60;

    let timeString = "";
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0 || hours > 0) timeString += `${minutes}m `;
    timeString += `${remainingSeconds}s`;

    return timeString;
  };

  const handleIntervencioToggle = (genere) => {
    // Si el temporitzador està actiu, l'aturem i guardem el temps
    if (timerActive[genere]) {
      setStats((prev) => ({
        ...prev,
        [genere]: {
          ...prev[genere],
          segons: prev[genere].segons + currentTime[genere],
        },
      }));
      setCurrentTime((prev) => ({
        ...prev,
        [genere]: 0,
      }));
    } else {
      // Si el temporitzador no està actiu, incrementem les intervencions
      setStats((prev) => ({
        ...prev,
        [genere]: {
          ...prev[genere],
          intervencions: prev[genere].intervencions + 1,
        },
      }));
      // Iniciem el temporitzador
      setStartTime((prev) => ({
        ...prev,
        [genere]: Date.now(),
      }));
    }
    
    // Canviem l'estat del temporitzador
    setTimerActive((prev) => ({
      ...prev,
      [genere]: !prev[genere],
    }));
  };

  const getTotalTime = (genere) => {
    return (
      stats[genere].segons + (timerActive[genere] ? currentTime[genere] : 0)
    );
  };

  // Generem dades del gràfic amb valors inicials de 0 (si no hi ha intervencions)
  const pieData = [
    { name: "Homes", value: stats.homes.intervencions || 0 },
    { name: "Dones/NB", value: stats.altres.intervencions || 0 },
  ];

  const timeData = [
    { name: "Homes", value: getTotalTime("homes") || 0 },
    { name: "Dones/NB", value: getTotalTime("altres") || 0 },
  ];

  const COLORS = ["#008A45", "#B72446"];

  return (
    <div
      style={{
        maxWidth: isDesktop ? "1200px" : "800px",
        margin: "0 auto",
        padding: "20px",
        paddingBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center", fontSize: "24px" }}>
        Informe de gènere
      </h1>

      {/* Controls - Responsive Layout */}
      <div style={{ 
        display: "flex", 
        flexDirection: isDesktop ? "row" : "column", 
        gap: "20px",
        justifyContent: "space-between",
      }}>
        {/* Secció Homes */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            flex: isDesktop ? "1" : "none",
            minWidth: isDesktop ? "250px" : "auto",
          }}
        >
          <h3
            style={{
              textAlign: "center",
              marginBottom: "10px",
              marginTop: "-5px",
            }}
          >
            Homes
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <button
              onClick={() => handleIntervencioToggle("homes")}
              style={{
                padding: "15px",
                backgroundColor: timerActive.homes ? "#B72446" : "#008A45",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                height: "60px",
              }}
            >
              {timerActive.homes 
                ? "Finalitzar intervenció" 
                : "Intervenció" + (stats.homes.intervencions > 0 ? ` (${stats.homes.intervencions})` : "")}
            </button>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              backgroundColor: "#ffffff",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            Temps total: {formatTime(getTotalTime("homes"))}
          </div>
        </div>

        {/* Secció Dones/NB */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            flex: isDesktop ? "1" : "none",
            minWidth: isDesktop ? "250px" : "auto",
          }}
        >
          <h3
            style={{
              textAlign: "center",
              marginBottom: "10px",
              marginTop: "-5px",
            }}
          >
            Dones/NB
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <button
              onClick={() => handleIntervencioToggle("altres")}
              style={{
                padding: "15px",
                backgroundColor: timerActive.altres ? "#B72446" : "#008A45",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                height: "60px",
              }}
            >
              {timerActive.altres 
                ? "Finalitzar intervenció" 
                : "Intervenció" + (stats.altres.intervencions > 0 ? ` (${stats.altres.intervencions})` : "")}
            </button>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              backgroundColor: "#ffffff",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            Temps total: {formatTime(getTotalTime("altres"))}
          </div>
        </div>
      </div>

      {/* Gràfics - Responsive Layout */}
      <div
        style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? "30px" : "60px",
          marginTop: "20px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ 
          height: "300px", 
          flex: isDesktop ? "1" : "none",
          minWidth: isDesktop ? "250px" : "auto", 
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "5px" }}>
            Distribució d'intervencions
          </h3>
          <div style={{ width: "100%", height: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={300}
                  animationBegin={0}
                  minAngle={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend height={50} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ 
          height: "300px", 
          flex: isDesktop ? "1" : "none",
          minWidth: isDesktop ? "250px" : "auto", 
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "5px" }}>
            Distribució de temps
          </h3>
          <div style={{ width: "100%", height: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={timeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={300}
                  animationBegin={0}
                  minAngle={0}
                >
                  {timeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend height={50} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Peu de pàgina amb logo */}
      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          paddingTop: "20px",
            display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <img 
          src={logoEntitat} 
          alt="Logo de l'entitat" 
          style={{ 
            height: "60px", 
            width: "auto", 
            maxWidth: "200px" 
          }} 
        />
      </div>
    </div>
  );
};

export default App;

const { useState, useEffect, useRef } = React;

function App() {
  const [programsByWeek, setProgramsByWeek] = useState({});
  const [selectedProgram, setSelectedProgram] = useState("Lunch Break");
  const playerRef = useRef(null);
  const [currentAudio, setCurrentAudio] = useState(null); // { src, label, id }
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("marks");
    if (stored) {
      setMarks(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("marks", JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    const today = new Date();
    const currentHour = today.getHours();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const endDate = new Date(today);
    const programsByWeekTemp = {};

    for (let dt = new Date(endDate); dt >= startDate; dt.setDate(dt.getDate() - 1)) {
      const dow = dt.getDay();
      const dayNum = dt.getDate();
      const dayOfWeek = dt.toLocaleString("pt-BR", { weekday: "short" });
      const weekNumber = getWeekNumber(dt);
      const weekRange = getWeekRange(dt);
      const weekKey = `Semana ${weekNumber} (${weekRange})`;
      if (!programsByWeekTemp[weekKey]) programsByWeekTemp[weekKey] = [];

      if (dt < today || (dt.toDateString() === today.toDateString() && currentHour >= 13)) {
        programsByWeekTemp[weekKey].push({
          date: new Date(dt),
          name: "Lunch Break",
          time: "13:00",
          dayOfWeek,
          dayNum,
        });
      }

      if (dow >= 4 && dow <= 6) {
        const energiaHorarios = ["22:00", "23:00", "00:00", "01:00"];
        energiaHorarios.forEach((hora, i) => {
          const dataBase = new Date(dt);
          if (i >= 2) dataBase.setDate(dataBase.getDate() + 1);

          if (
            dataBase < today ||
            (dataBase.toDateString() === today.toDateString() && currentHour >= parseInt(hora))
          ) {
            const energiaWeek = getWeekNumber(dataBase);
            const energiaRange = getWeekRange(dataBase);
            const energiaKey = `Semana ${energiaWeek} (${energiaRange})`;
            if (!programsByWeekTemp[energiaKey]) programsByWeekTemp[energiaKey] = [];

            programsByWeekTemp[energiaKey].push({
              date: new Date(dataBase),
              name: "Energia na Noite",
              time: hora,
              dayOfWeek: dataBase.toLocaleString("pt-BR", { weekday: "short" }),
              dayNum: dataBase.getDate(),
            });
          }
        });
      }
    }

    setProgramsByWeek(programsByWeekTemp);
  }, []);

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString()} a ${sunday.toLocaleDateString()}`;
  };

  const getUrl = (date, hour) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = hour.substring(0, 2);
    return `https://replay.97fm.com.br/${y}${m}${d}${hh}.mp4`;
  };

  const playAudio = (program, idx) => {
    const src = getUrl(program.date, program.time);
    const label = `${program.name} – ${program.dayOfWeek} ${program.dayNum} às ${program.time}`;
    const id = `${formatDateKey(program.date)}-${program.time}-${idx}`;
    setCurrentAudio({ src, label, id });

    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.load();
        playerRef.current.play().catch((err) => {
          console.warn("⚠️ Autoplay bloqueado pelo navegador:", err);
        });
      }
    }, 100);
  };

  const handleSeek = (seconds) => {
    const audio = playerRef.current;
    if (!audio) return;

    try {
      const atual = audio.currentTime;
      const duracao = audio.duration || 0;
      let novoTempo = atual + seconds;
      novoTempo = Math.max(0, Math.min(novoTempo, duracao));
      audio.currentTime = novoTempo;

      if (!audio.paused) {
        audio.play().catch(err => {
          console.warn("⚠️ Não conseguiu retomar a reprodução:", err);
        });
      }

      console.log(`⏩ Pulado para ${novoTempo.toFixed(1)}s`);
    } catch (err) {
      console.error("❌ Erro ao avançar/retroceder:", err);
    }
  };

  const addMark = () => {
    const tempo = playerRef.current && playerRef.current.currentTime ? playerRef.current.currentTime : 0;
    if (currentAudio) {
      setMarks([...marks, { audioId: currentAudio.id, time: tempo }]);
    }
  };

  const playMark = (time) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
      playerRef.current.play();
    }
  };

  const removeMark = (index) => {
    const nova = [...marks];
    nova.splice(index, 1);
    setMarks(nova);
  };

  return (
    <div className="container" style={{ width: '100%' }}>
      <div className="buttons">
        <button
          className={selectedProgram === "Lunch Break" ? "active" : ""}
          onClick={() => setSelectedProgram("Lunch Break")}
        >
          Lunch Break
        </button>
        <button
          className={selectedProgram === "Energia na Noite" ? "active" : ""}
          onClick={() => setSelectedProgram("Energia na Noite")}
        >
          Energia na Noite
        </button>
      </div>

      {Object.entries(programsByWeek).map(([week, items]) => {
        const filtered = items.filter((p) => p.name === selectedProgram);
        if (filtered.length === 0) return null;

        return (
          <div key={week} className="week-group">
            <h2 style={{ textAlign: 'left' }}>{selectedProgram} – {week}</h2>
            {filtered.map((program, idx) => {
              const id = `${formatDateKey(program.date)}-${program.time}-${idx}`;
              return (
                <div
                  key={idx}
                  className="program-line"
                  style={{ flexDirection: 'column', display: 'flex', alignItems: 'flex-start', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background 0.3s' }}
                  onClick={() => playAudio(program, idx)}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f4f4f4'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="program-label">
                    {program.dayOfWeek} {program.dayNum} – {program.time}
                  </div>
                  <div className="mark-controls" style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {marks.map((m, i) => (
                        m.audioId.includes(`${formatDateKey(program.date)}-${program.time}`) && (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); playMark(m.time); }} style={{ backgroundColor: 'gold', padding: '4px 10px' }}>
                              {Math.floor(m.time / 60)}:{String(Math.floor(m.time % 60)).padStart(2, '0')}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); removeMark(i); }} style={{ color: 'red', fontWeight: 'bold' }}>x</button>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  {currentAudio && currentAudio.id === id && (
                    <div className="global-player" style={{ width: '100%' }}>
                      <p><strong>🎧 Reproduzindo:</strong> {currentAudio.label}</p>
                      <div className="player-buttons" style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(-300); }}>-5M</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(-180); }}>-3M</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(-60); }}>-1M</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(30); }}>+30s</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(60); }}>+1M</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(180); }}>+3M</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSeek(300); }}>+5M</button>
                      </div>
                      <audio ref={playerRef} controls preload="metadata" style={{ width: '100%' }}>
                        <source src={currentAudio.src} type="audio/mp4" />
                        Seu navegador não suporta áudio.
                      </audio>
                      <div className="mark-controls" style={{ marginTop: '10px', textAlign: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); addMark(); }} style={{ backgroundColor: 'gold', padding: '8px 16px', marginBottom: '8px' }}>+ Marcar Momento</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

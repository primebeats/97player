const { useState, useEffect } = React;

function App() {
  const [programsByWeek, setProgramsByWeek] = useState({});
  const [selectedProgram, setSelectedProgram] = useState("Lunch Break");

  useEffect(() => {
    const today = new Date();
    const currentHour = today.getHours();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const endDate = new Date(today);

    const programsByWeekTemp = {};

    for (let dt = new Date(endDate); dt >= startDate; dt.setDate(dt.getDate() - 1)) {
      const dow = dt.getDay();
      const dayNum = dt.getDate();
      const dayOfWeek = dt.toLocaleString('pt-BR', { weekday: 'short' });
      const weekNumber = getWeekNumber(dt);
      const weekKey = `Semana ${weekNumber}`;

      if (!programsByWeekTemp[weekKey]) programsByWeekTemp[weekKey] = [];

      // Lunch Break
      if (dt < today || (dt.toDateString() === today.toDateString() && currentHour >= 13)) {
        programsByWeekTemp[weekKey].push({
          date: new Date(dt),
          name: "Lunch Break",
          time: "13:00",
          dayOfWeek,
          dayNum
        });
      }

      // Energia na Noite
      if (dow >= 4 && dow <= 6) {
        const energiaHorarios = ["22:00", "23:00", "00:00", "01:00"];
        energiaHorarios.forEach((hora, i) => {
          const dataBase = new Date(dt);
          if (i >= 2) dataBase.setDate(dataBase.getDate() + 1);

          if (dataBase < today || (dataBase.toDateString() === today.toDateString() && currentHour >= parseInt(hora))) {
            const energiaWeek = getWeekNumber(dataBase);
            const energiaKey = `Semana ${energiaWeek}`;
            if (!programsByWeekTemp[energiaKey]) programsByWeekTemp[energiaKey] = [];

            programsByWeekTemp[energiaKey].push({
              date: new Date(dataBase),
              name: "Energia na Noite",
              time: hora,
              dayOfWeek: dataBase.toLocaleString('pt-BR', { weekday: 'short' }),
              dayNum: dataBase.getDate()
            });
          }
        });
      }
    }

    setProgramsByWeek(programsByWeekTemp);
  }, []);

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getUrl = (date, hour) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = hour.substring(0, 2);
    return `https://replay.97fm.com.br/${y}${m}${d}${hh}.mp4`;
  };

  return (
    <div className="container">
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
        const filtered = items.filter(p => p.name === selectedProgram);
        if (filtered.length === 0) return null;

        return (
          <div key={week} className="week-group">
            <h2>{selectedProgram} – {week}</h2>
            {filtered.map((program, idx) => (
              <div key={idx} className="program-line">
                <div className="program-label">
                  {program.dayOfWeek} {program.dayNum} – {program.time}
                </div>
                <audio controls src={getUrl(program.date, program.time)}></audio>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

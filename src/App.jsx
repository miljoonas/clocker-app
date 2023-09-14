import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const App = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const countRef = useRef(null);
  const [clockerName, setClockerName] = useState('')
  const [scores, setScores] = useState([])
  const [highligtedScoreId, setHighlightedScoreId] = useState(null)

  useEffect(() => {
    axios
      .get('http://localhost:3001/scores')
      .then(initialScores => {
        setScores(initialScores.data)
      })
  }, [])

  const handleStartPause = () => {
    if (!isRunning) {
      const startTime = Date.now() - elapsedTime;
      countRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
      setIsRunning(true);
    } else {
      clearInterval(countRef.current);
      setIsRunning(false);
    }
  }

  const handleReset = () => {
    clearInterval(countRef.current);
    setIsRunning(false);
    setElapsedTime(0);
  }

  const addScore = (event) => {
    event.preventDefault()
    const duplicateEntry = scores.find(clocker => clocker.name === clockerName && clockerName !== "")
    if (duplicateEntry !== undefined) {
      if (duplicateEntry.time > elapsedTime) {
        if (window.confirm(`Replace score of ${duplicateEntry.name}? previous time: ${duplicateEntry.time / 1000}, new time: ${elapsedTime / 1000}`)) {
          const changedScore = { ...duplicateEntry, time: elapsedTime }
          axios
            .put(`http://localhost:3001/scores/${duplicateEntry.id}`, changedScore)
            .then(returnedScore => {
              setScores(scores.map(scorer => scorer.id !== duplicateEntry.id ? scorer : returnedScore.data))
              setHighlightedScoreId(returnedScore.data.id)
              setTimeout(() => {
                setHighlightedScoreId(null)
              }, 5000)
              setClockerName('')
            })
        }
      }
    }
    else {

      const clockerObject = {
        time: elapsedTime,
        name: clockerName
      }
      axios
        .post('http://localhost:3001/scores', clockerObject)
        .then(returnedScore => {
          setScores(scores.concat(returnedScore.data))
          setClockerName('')
          setHighlightedScoreId(returnedScore.data.id)
          setTimeout(() => {
            setHighlightedScoreId(null)
          }, 5000)
        })
    }
  }

  const handleClockerNameChange = (event) => { setClockerName(event.target.value) }

  const sortedScores = scores.slice().sort((a, b) => a.time - b.time);

  return (
    <div className='container'>
      <div className="stopwatch">
        <img src='././public/logo.png'></img>
        <h1><a href='http://etä.kellot.us' target='_blank'>Kellot.us</a></h1>
        <div className="time">
        </div>
        <div>
          <h2>
            {elapsedTime / 1000}
          </h2>
        </div>
        <button onClick={() => handleStartPause()}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={() => handleReset()}>Reset</button>
        <form onSubmit={addScore}>
          <input
            value={clockerName}
            onChange={handleClockerNameChange}
          />
          <button type='submit'>add</button>
        </form>
        <ol>
          {sortedScores.map(scorer =>
            <li
              key={scorer.id}
              className={scorer.id === highligtedScoreId ? 'highlighted-score' : ''}
            >
              <strong className='times'>{scorer.time / 1000}</strong> {scorer.name}
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}

export default App
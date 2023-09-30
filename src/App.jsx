import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const App = () => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const countRef = useRef(null)
  const [clockerName, setClockerName] = useState('')
  const [scores, setScores] = useState([])
  const [highligtedScoreId, setHighlightedScoreId] = useState(null)
  const [editingScore, setEditingScore] = useState(null)
  const [newName, setNewName] = useState('')
  const [editButtonsVisible, setEditButtonsVisible] = useState(false);

  const handleClockerNameChange = (event) => { setClockerName(event.target.value) }
  const sortedScores = scores.slice().sort((a, b) => a.time - b.time)

  useEffect(() => {
    axios
      .get('http://localhost:3001/scores')
      .then(initialScores => {
        setScores(initialScores.data)
      })
  }, [])

  const handleStartPause = () => {
    if (!isRunning) {
      const startTime = Date.now() - elapsedTime
      countRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 10)
      setIsRunning(true)
    } else {
      clearInterval(countRef.current)
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    clearInterval(countRef.current)
    setIsRunning(false)
    setElapsedTime(0)
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
              }, 10000)
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

  const handleEditScore = (score) => {
    setEditingScore(score)
    setNewName(score.name)
  }

  const saveEditedName = () => {
    if (editingScore && newName.trim() !== '') {
      const updatedScore = { ...editingScore, name: newName }
      axios
        .put(`http://localhost:3001/scores/${editingScore.id}`, updatedScore)
        .then((returnedScore) => {
          setScores((prevScores) =>
            prevScores.map((score) =>
              score.id === returnedScore.data.id ? returnedScore.data : score
            )
          )
          setEditingScore(null)
        })
    }
  }

  const deleteScore = id => {
    if (window.confirm(`Delete ${scores.find(n => n.id === id).name}?`)) {
      axios
        .delete(`http://localhost:3001/scores/${id}`)
        .then(() =>
          setScores(scores.filter(scores => scores.id !== id)))
    }
  }

  const toggleEditButtonsVisibility = () => {
    setEditButtonsVisible((prevVisible) => !prevVisible);
  };

  return (
    <div className='container'>
      <button className='togglebutton' onClick={toggleEditButtonsVisibility}>
        {editButtonsVisible ? 'X' : 'O'}
      </button>
      <div className="stopwatch">
        <img src='./hankkija.svg'></img>
        <h1><a href='http://etä.kellot.us' target='_blank'>Leaderboard</a></h1>
        <div className="time">
        </div>
        <div>
          <h1 className='elapsedtime'>
            {(elapsedTime / 1000).toFixed(3)}
          </h1>
        </div>
        <button className='startbutton' onClick={() => handleStartPause()}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button className='resetbutton' onClick={() => handleReset()}>Reset</button>
        <form onSubmit={addScore}>
          <input
            value={clockerName}
            onChange={handleClockerNameChange}
          />
          <button className='addbutton' type='submit'>add</button>
        </form>
        <ol>
          {sortedScores.map((scorer) => (
            <li
              key={scorer.id}
              className={scorer.id === highligtedScoreId ? 'highlighted-score' : ''}
            >
              {editingScore === scorer ? (
                <div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button onClick={saveEditedName}>Save</button>
                </div>
              ) : (
                <div>
                  <strong className="times">{scorer.time / 1000}</strong> {scorer.name}
                  {editButtonsVisible && (
                    <button className='editbutton' onClick={() => handleEditScore(scorer)}>Edit</button>
                  )}
                  {editButtonsVisible && (
                    <button className='deletebutton' onClick={() => deleteScore(scorer.id)}>X</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default App
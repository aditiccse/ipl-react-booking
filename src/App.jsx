
import { useState } from 'react'
import './App.css'

// Navbar Component
function Navbar() {
  return (
    <nav className="navbar">
      <h2>IPL 2026</h2>
      <div>
        <a href="#home">Home</a>
        <a href="#matches">Matches</a>
        <a href="#book">Book Ticket</a>
      </div>
    </nav>
  )
}

// Hero Component
function Hero() {
  return (
    <section className="hero" id="home">
      <h1>Experience The Stadium Energy Live!</h1>
      <p>Book your tickets and enjoy IPL 2026.</p>
      <a href="#matches">View Matches</a>
    </section>
  )
}

// MatchCard Component
function MatchCard({ match, venue, date, price }) {
  return (
    <div className="match-card">
      <h2>{match}</h2>
      <p>{date}</p>
      <p>Venue: {venue}</p>
      <p>Ticket Price: ₹{price}</p>
      <button>Book Now</button>
    </div>
  )
}

// Match Details
const matches = [
  {
    id: 1,
    match: 'CSK vs MI',
    venue: 'Chennai',
    date: '7:30 PM',
    price: 800,
    team: 'CSK'
  },
  {
    id: 2,
    match: 'RCB vs KKR',
    venue: 'Bengaluru',
    date: '7:30 PM',
    price: 1000,
    team: 'RCB'
  },
  {
    id: 3,
    match: 'MI vs RCB',
    venue: 'Mumbai',
    date: '3:30 PM',
    price: 900,
    team: 'MI'
  }
]

// Main App Component
function App() {
  const [selectedTeam, setSelectedTeam] = useState('All')

  const filteredMatches = selectedTeam === 'All'
  ? matches
  : matches.filter((item) => item.match.includes(selectedTeam))

  return (
    <>
      <Navbar />
      <Hero />

      <section id="matches">
        <h1>Match Schedule</h1>

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="All">All Teams</option>
          <option value="CSK">CSK</option>
          <option value="RCB">RCB</option>
          <option value="KKR">KKR</option>
          <option value="MI">MI</option>
        </select>


        <div className="match-container">
          {filteredMatches.map((item) => (
            <MatchCard
              key={item.id}
              match={item.match}
              venue={item.venue}
              date={item.date}
              price={item.price}
            />
          ))}
        </div>
      </section>
    </>
  )
}

export default App

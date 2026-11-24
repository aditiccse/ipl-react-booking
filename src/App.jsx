
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

// Navbar Component
function Navbar({ bookingCount, onNavigate }) {
  return (
    <nav className="navbar">
      <h2>IPL 2026</h2>
      <div>
        <a href="#home" onClick={() => onNavigate('home')}>Home</a>
        <a href="#matches" onClick={() => onNavigate('matches')}>Matches</a>
        <a href="#booking" onClick={() => onNavigate('matches')}>Book Ticket</a>
        <a href="#my-bookings" onClick={() => onNavigate('bookings')}>My Bookings</a>
        <span>Bookings: {bookingCount}</span>
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
function MatchCard({
  match,
  venue,
  date,
  price,
  availableSeats,
  onBook
}) {
  return (
    <div className="match-card">
      <h2>{match}</h2>
      <p>{date}</p>
      <p>Venue: {venue}</p>
      <p>Ticket Price: ₹{price}</p>
      <p>{availableSeats} seats left</p>

      <button
        onClick={onBook}
        disabled={availableSeats <= 0}
      >
        {availableSeats > 0 ? 'Book Tickets' : 'Sold Out'}
      </button>
    </div>
  )
}

// My Bookings Component
function MyBookings({ bookings, loading, error }) {
  return (
    <section id="my-bookings">
      <h1>My Bookings</h1>

      {loading && <p>Loading bookings...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p>No bookings found.</p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Match</th>
              <th>Quantity</th>
              <th>Total Price</th>
              <th>Booking Date</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  {booking.matches
                    ? `${booking.matches.team1} vs ${booking.matches.team2}`
                    : `Match ID: ${booking.match_id}`}
                </td>
                <td>{booking.seats}</td>
                <td>₹{booking.total_price}</td>
                <td>
                  {new Date(booking.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

// Main App Component
function App() {
  const [matches, setMatches] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('All')
  const [bookingCount, setBookingCount] = useState(0)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [seats, setSeats] = useState(1)
  const [message, setMessage] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState('home')
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState('')

  // Fetch matches
  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')

    if (error) {
      console.error('Error fetching matches:', error)
    } else {
      setMatches(data || [])
    }
  }

  // Fetch total booking count
  const fetchBookingCount = async () => {
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookingCount(count || 0)
    }
  }

  // Fetch all bookings from Supabase
  const fetchBookings = async () => {
    setBookingsLoading(true)
    setBookingsError('')

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        match_id,
        seats,
        total_price,
        created_at,
        matches (
          team1,
          team2
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching booking records:', error)
      setBookingsError('Could not load bookings: ' + error.message)
    } else {
      setBookings(data || [])
    }

    setBookingsLoading(false)
  }

  // Initial fetch and Realtime updates
  useEffect(() => {
    fetchMatches()
    fetchBookingCount()

    const channel = supabase
      .channel('ipl-live-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          fetchMatches()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchBookingCount()
          fetchBookings()
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Navigate between pages
  const handleNavigate = (page) => {
    setCurrentPage(page)

    if (page === 'bookings') {
      fetchBookings()
    }

    if (page === 'matches') {
      setSelectedMatch(null)
    }
  }

  // Open booking form
  const openBooking = (match) => {
    setSelectedMatch(match)
    setCustomerName('')
    setSeats(1)
    setMessage('')
  }

  // Book ticket
  const handleBooking = async (e) => {
    e.preventDefault()

    if (!customerName.trim()) {
      setMessage('Please enter your name.')
      return
    }

    if (
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > selectedMatch.available_seats
    ) {
      setMessage('Please enter a valid number of tickets.')
      return
    }

    setBookingLoading(true)
    setMessage('')

    const totalPrice = selectedMatch.price * seats
    const remainingSeats = selectedMatch.available_seats - seats

    // Update available seats
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({ available_seats: remainingSeats })
      .eq('id', selectedMatch.id)
      .gte('available_seats', seats)
      .select('id')

    if (updateError || !updatedMatch || updatedMatch.length === 0) {
      setMessage(
        updateError
          ? 'Could not update seats: ' + updateError.message
          : 'Not enough seats available. Please refresh and try again.'
      )

      setBookingLoading(false)
      return
    }

    // Insert booking into Supabase
    const { error: insertError } = await supabase
      .from('bookings')
      .insert([
        {
          match_id: selectedMatch.id,
          customer_name: customerName.trim(),
          seats: seats,
          total_price: totalPrice
        }
      ])

    if (insertError) {
      // Restore seats if booking fails
      await supabase
        .from('matches')
        .update({
          available_seats: selectedMatch.available_seats
        })
        .eq('id', selectedMatch.id)

      setMessage('Booking failed: ' + insertError.message)
      setBookingLoading(false)
      return
    }

    // Update match data on website
    setMatches((previousMatches) =>
      previousMatches.map((item) =>
        item.id === selectedMatch.id
          ? { ...item, available_seats: remainingSeats }
          : item
      )
    )

    await fetchBookingCount()
    await fetchBookings()

    setMessage('Booking successful!')

    alert(
      `Booking Successful!\n\nName: ${customerName}\nMatch: ${selectedMatch.team1} vs ${selectedMatch.team2}\nTickets: ${seats}\nTotal Price: ₹${totalPrice}`
    )

    setSelectedMatch(null)
    setBookingLoading(false)
  }

  // Filter matches by team
  const filteredMatches = selectedTeam === 'All'
    ? matches
    : matches.filter(
        (item) =>
          item.team1.includes(selectedTeam) ||
          item.team2.includes(selectedTeam)
      )

  return (
    <>
      <Navbar
        bookingCount={bookingCount}
        onNavigate={handleNavigate}
      />

      {currentPage === 'home' && (
        <Hero />
      )}

      {currentPage !== 'bookings' && (
        <>
          {/* Match Schedule */}
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
              <option value="GT">GT</option>
              <option value="RR">RR</option>
              <option value="SRH">SRH</option>
              <option value="DC">DC</option>
              <option value="LSG">LSG</option>
              <option value="PBKS">PBKS</option>
            </select>

            <div className="match-container">
              {filteredMatches.map((item) => (
                <MatchCard
                  key={item.id}
                  match={`${item.team1} vs ${item.team2}`}
                  venue={item.venue}
                  date={item.date}
                  price={item.price}
                  availableSeats={item.available_seats}
                  onBook={() => openBooking(item)}
                />
              ))}
            </div>
          </section>

          {/* Booking Form */}
          {selectedMatch && currentPage !== 'bookings' && (
            <section id="booking">
              <h2>Book Your Tickets</h2>

              <form onSubmit={handleBooking}>
                <p>
                  Match: {selectedMatch.team1} vs {selectedMatch.team2}
                </p>

                <p>Ticket Price: ₹{selectedMatch.price}</p>

                <p>
                  Available Seats: {selectedMatch.available_seats}
                </p>

                <label>Customer Name</label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />

                <label>Number of Tickets</label>

                <input
                  type="number"
                  min="1"
                  max={selectedMatch.available_seats}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  required
                />

                <h3>Total Price: ₹{selectedMatch.price * seats}</h3>

                <button type="submit" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                >
                  Cancel
                </button>

                {message && <p>{message}</p>}
              </form>
            </section>
          )}
        </>
      )}

      {/* My Bookings Page */}
      {currentPage === 'bookings' && (
        <MyBookings
          bookings={bookings}
          loading={bookingsLoading}
          error={bookingsError}
        />
      )}
    </>
  )
}

export default App

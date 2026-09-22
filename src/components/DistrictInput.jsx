import { useState, useRef, useEffect } from 'react'
import { BD_DISTRICTS } from '../lib/utils'

export default function DistrictInput({ value, onChange, placeholder = 'e.g. Dhaka', className = 'form-input', id }) {
  const [matches, setMatches] = useState([])
  const [open, setOpen]       = useState(false)
  const [hi, setHi]           = useState(-1)
  const wrapRef               = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    onChange(q)
    const m = q.trim()
      ? BD_DISTRICTS.filter(d => d.toLowerCase().includes(q.toLowerCase()))
      : []
    setMatches(m)
    setOpen(m.length > 0)
    setHi(-1)
  }

  function select(d) {
    onChange(d)
    setOpen(false)
  }

  function handleKey(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, matches.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && hi >= 0) select(matches[hi])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        id={id}
        type="text"
        className={className}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        onFocus={() => { if (matches.length > 0) setOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div className="autocomplete-list">
          {matches.map((d, i) => (
            <div
              key={d}
              className="autocomplete-item"
              style={i === hi ? { background: 'var(--lavender)', color: 'var(--teal-dark)' } : {}}
              onMouseDown={() => select(d)}
            >
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
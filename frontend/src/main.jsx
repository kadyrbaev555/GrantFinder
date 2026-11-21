import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './style.css'
import graduationPhoto from './assets/graduation.jpg'
import Deadline from './Deadline.jsx'
import ProgramPage from './ProgramPage.jsx'

function ConnectionStatus() {
  const [status, setStatus] = useState('pending')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function check() {
      try {
        const response = await fetch('/health', {
          signal: controller.signal,
          cache: 'no-store',
        })
        const healthy = response.ok && (await response.json()).status === 'ok'
        setStatus(healthy ? 'ok' : 'error')
      } catch {
        if (!controller.signal.aborted) setStatus('error')
      }
    }
    check()
    return () => controller.abort()
  }, [attempt])

  const labels = {
    pending: 'Проверяем соединение…',
    ok: 'Соединение с API установлено',
    error: 'Не удалось подключиться к API',
  }

  return (
    <footer>
      <span role="status" data-state={status}>{labels[status]}</span>
      {status === 'error' && (
        <button onClick={() => {
          setStatus('pending')
          setAttempt(attempt + 1)
        }}>Проверить снова</button>
      )}
    </footer>
  )
}

function ProgramCard({ program }) {
  return (
    <article className="card">
      <div className="country"><i className="pin" aria-hidden="true" />{program.country}</div>
      <h3><a className="program-link" href={`/?program=${program.id}`}>{program.title}</a></h3>
      <p className="organizer">{program.organizer}</p>
      <dl>
        <div><dt>Уровень образования</dt><dd>{program.education_level}</dd></div>
        <div><dt>Приём заявок</dt><dd><Deadline value={program.deadline} /></dd></div>
      </dl>
    </article>
  )
}

const emptyFilters = { q: '', country: '', education_level: '', funding_type: '' }
const filterFields = [
  { name: 'country', label: 'Страна', placeholder: 'Все страны' },
  { name: 'education_level', label: 'Уровень образования', placeholder: 'Все уровни' },
  { name: 'funding_type', label: 'Финансирование', placeholder: 'Все типы' },
]

function CatalogFilters({ filters, options, onChange, onReset }) {
  return (
    <div className="catalog-filters" role="search" aria-label="Поиск программ">
      <label>Название программы
        <input type="search" value={filters.q} placeholder="Например, DAAD"
          onChange={event => onChange('q', event.target.value)} />
      </label>
      {filterFields.map(({ name, label, placeholder }) => (
        <div className="select-field" key={name}>
          <label htmlFor={`filter-${name}`}>{label}</label>
          <select id={`filter-${name}`} value={filters[name]} onChange={event => onChange(name, event.target.value)}>
            <option value="">{placeholder}</option>
            {options[name].map(value => <option key={value}>{value}</option>)}
          </select>
        </div>
      ))}
      <button type="button" onClick={onReset} disabled={!Object.values(filters).some(Boolean)}>Сбросить</button>
    </div>
  )
}

function Catalog() {
  const [programs, setPrograms] = useState(null)
  const [failed, setFailed] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [options, setOptions] = useState(null)
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(filters)) {
    if (value.trim()) params.set(name, value.trim())
  }
  const query = params.toString()

  useEffect(() => {
    const controller = new AbortController()
    setFailed(false)
    setPrograms(null)
    async function load() {
      try {
        const response = await fetch('/api/v1/scholarships' + (query ? '?' + query : ''), { signal: controller.signal })
        if (!response.ok) throw new Error('Catalog request failed')
        const rows = await response.json()
        if (controller.signal.aborted) return
        if (!query) {
          const choices = {}
          for (const { name } of filterFields) {
            const values = rows.flatMap(row => name === 'education_level' ? row[name].split(', ') : [row[name]])
            choices[name] = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
          }
          setOptions(choices)
        }
        setPrograms(rows)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    load()
    return () => controller.abort()
  }, [query])

  return (
    <section id="catalog" aria-labelledby="catalog-heading">
      <div className="section-title">
        <h2 id="catalog-heading">Каталог программ</h2>
        {programs && <span className="count" aria-label={`Количество программ: ${programs.length}`}>{programs.length}</span>}
      </div>
      {options && <CatalogFilters filters={filters} options={options}
        onChange={(name, value) => setFilters(current => ({ ...current, [name]: value }))}
        onReset={() => setFilters(emptyFilters)} />}
      {programs?.length > 0 ? (
        <div className="cards">{programs.map(program => <ProgramCard key={program.id} program={program} />)}</div>
      ) : <p role="status">{failed ? 'Не удалось загрузить каталог.' : programs && query
        ? 'Программы не найдены. Измените условия или нажмите «Сбросить».'
        : programs ? 'В каталоге пока нет программ.' : 'Загружаем программы…'}</p>}
    </section>
  )
}

function App() {
  const programId = new URLSearchParams(window.location.search).get('program')
  return (
    <>
      <header>
        <a className="brand" href="./" lang="en"><span aria-hidden="true" className="mark">↗</span>GrantFinder</a>
        <a className="nav-link" href="/#catalog">Каталог программ <span aria-hidden="true">{programId === null ? '↓' : '↗'}</span></a>
      </header>
      <main>
        {programId !== null ? <ProgramPage id={programId} /> : <>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="intro">
            <h1 id="hero-heading">Гранты и<br /><em>стипендии</em></h1>
            <p>Образовательные программы в Казахстане и за рубежом для тех, кто ищет финансирование учёбы.</p>
            <a className="browse" href="#catalog">Смотреть программы <span aria-hidden="true">↓</span></a>
          </div>
          <div className="postcard" aria-hidden="true">
            <div className="orbits" />
            <div className="photo"><img src={graduationPhoto} width="1200" height="800" alt="" /></div>
            <div className="compass">✦</div>
          </div>
        </section>
        <Catalog />
        </>}
      </main>
      <ConnectionStatus />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)

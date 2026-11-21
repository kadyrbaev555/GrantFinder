import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './style.css'
import graduationPhoto from './assets/graduation.jpg'

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

const formatDeadline = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
})

function ProgramCard({ program }) {
  return (
    <article className="card">
      <div className="country"><i className="pin" aria-hidden="true" />{program.country}</div>
      <h3>{program.title}</h3>
      <p className="organizer">{program.organizer}</p>
      <dl>
        <div><dt>Уровень образования</dt><dd>{program.education_level}</dd></div>
        <div><dt>Приём заявок</dt><dd>{program.deadline
          ? <time dateTime={program.deadline}>{formatDeadline.format(new Date(program.deadline))}</time>
          : 'Срок не указан'}</dd></div>
      </dl>
    </article>
  )
}

function Catalog() {
  const [programs, setPrograms] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch('/api/v1/scholarships', { signal: controller.signal })
        if (!response.ok) throw new Error('Catalog request failed')
        setPrograms(await response.json())
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  return (
    <section id="catalog" aria-labelledby="catalog-heading">
      <div className="section-title">
        <h2 id="catalog-heading">Каталог программ</h2>
        {programs && <span className="count" aria-label={`Количество программ: ${programs.length}`}>{programs.length}</span>}
      </div>
      {programs?.length > 0 ? (
        <div className="cards">{programs.map(program => <ProgramCard key={program.id} program={program} />)}</div>
      ) : <p role="status">{failed ? 'Не удалось загрузить каталог.' : programs ? 'В каталоге пока нет программ.' : 'Загружаем программы…'}</p>}
    </section>
  )
}

function App() {
  return (
    <>
      <header>
        <a className="brand" href="./" lang="en"><span aria-hidden="true" className="mark">↗</span>GrantFinder</a>
        <a className="nav-link" href="#catalog">Каталог программ <span aria-hidden="true">↓</span></a>
      </header>
      <main>
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
      </main>
      <ConnectionStatus />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)

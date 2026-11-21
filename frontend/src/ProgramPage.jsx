import { useEffect, useState } from 'react'
import Deadline from './Deadline.jsx'
import RequestNotice from './RequestNotice.jsx'

export default function ProgramPage({ id }) {
  const [program, setProgram] = useState(null)
  const [state, setState] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    setProgram(null)
    async function load() {
      if (!id) {
        setState('missing')
        return
      }
      try {
        const response = await fetch('/api/v1/scholarships/' + encodeURIComponent(id), {
          signal: controller.signal,
        })
        if (response.status === 404 || response.status === 400) {
          if (!controller.signal.aborted) setState('missing')
          return
        }
        if (!response.ok) throw new Error('Program request failed')
        const details = await response.json()
        if (!controller.signal.aborted) {
          setProgram(details)
          document.title = details.title + ' — GrantFinder'
        }
      } catch {
        if (!controller.signal.aborted) setState('error')
      }
    }
    load()
    return () => controller.abort()
  }, [id, attempt])

  if (!program) {
    const messages = {
      loading: 'Загружаем программу…',
      missing: 'Программа не найдена.',
      error: 'Не удалось загрузить программу.',
    }
    return <RequestNotice message={messages[state]} loading={state === 'loading'}>
      {state === 'error' && <button onClick={() => setAttempt(n => n + 1)}>Повторить запрос</button>}
      <a href="/#catalog">← В каталог</a>
    </RequestNotice>
  }

  return (
    <article className="program-page">
      <div className="program-heading">
        <span className="country"><i className="pin" aria-hidden="true" />{program.country}</span>
        <h1>{program.title}</h1>
        <p>{program.organizer}</p>
      </div>
      <div className="program-body">
        <div className="program-copy">
          <section><h2>О программе</h2><p>{program.description}</p></section>
          <section><h2>Требования</h2><p>{program.requirements}</p></section>
          <section><h2>Финансирование</h2><p>{program.funding_details}</p></section>
        </div>
        <aside aria-label="Условия программы">
          <dl>
            <div><dt>Уровень образования</dt><dd>{program.education_level}</dd></div>
            <div><dt>Тип финансирования</dt><dd>{program.funding_type}</dd></div>
            <div><dt>Приём заявок</dt><dd><Deadline value={program.deadline} /></dd></div>
          </dl>
          <a className="browse" href={program.official_url}>Официальный сайт <span aria-hidden="true">↗</span></a>
        </aside>
      </div>
    </article>
  )
}

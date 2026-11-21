const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
})

export default function Deadline({ value }) {
  return value ? <time dateTime={value}>{dateFormat.format(new Date(value))}</time> : 'Срок не указан'
}

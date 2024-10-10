import { formatInTimeZone } from 'date-fns-tz';


export function formateTimeZone(date: Date) {
  return formatInTimeZone(date, `${process.env.MY_APP_TIMEZONE}`, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
}

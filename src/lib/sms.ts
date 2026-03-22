import { db } from '@/lib/db'

async function getSmsCredentials() {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ['sms_username', 'sms_password', 'sms_originator'] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return {
      username: map.sms_username || '',
      password: map.sms_password || '',
      originator: map.sms_originator || '',
    }
  } catch {
    return { username: '', password: '', originator: '' }
  }
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const { username, password, originator } = await getSmsCredentials()

  if (!username || !password) {
    console.log(`[SMS FALLBACK] To: ${phone}, Message: ${message}`)
    return false
  }

  try {
    const params = new URLSearchParams({
      usercode: username,
      password,
      gsmno: phone.replace(/\D/g, ''),
      message,
      msgheader: originator,
      dil: 'TR',
    })

    const res = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params}`, {
      method: 'GET',
    })
    const text = await res.text()
    return text.startsWith('00') || text.startsWith('01') || text.startsWith('02')
  } catch (err) {
    console.error('[SMS Error]', err)
    return false
  }
}

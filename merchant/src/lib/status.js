import { MeetStatusType } from '@smooosy/config'

export const calcTab = meet => {
  if (meet.archive) {
    return 'archive'
  } else if (['done', 'progress'].includes(meet.status)) {
    return 'hired'
  } else if (meet.chatStatus === MeetStatusType.RESPONDED) {
    return 'talking'
  }
  return 'waiting'
}

export function explicitSuspend(suspend) {
  // suspendが存在してadminを含んでいない
  return !!suspend && !/admin/.test(suspend)
}

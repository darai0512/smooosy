const notificationTypes = {
  newRequest: {
    label: 'ユーザーからの新規依頼',
    target: ['pro'],
  },
  newContact: {
    label: 'ユーザーからのご指名依頼',
    target: ['pro'],
    isMatchMore: true,
  },
  remindRequest: {
    label: '新規依頼のリマインド',
    target: ['pro'],
  },
  meetRead: {
    label: '見積もりの既読',
    target: ['pro'],
  },
  workStart: {
    label: '依頼の成約',
    target: ['pro'],
  },
  remindMeetsPro: {
    label: '未成約依頼のリマインド',
    target: ['pro'],
  },
  reviewDone: {
    label: '顧客のクチコミ投稿',
    target: ['pro'],
  },
  reviewReply: {
    label: 'プロのクチコミ返信',
    target: ['user'],
  },
  dailyRemind: {
    label: 'やることリスト',
    target: ['pro'],
  },
  bookingRequest: {
    label: 'スケジュールの予約',
    target: ['pro'],
  },
  bookingUpdate: {
    label: '予約のキャンセル',
    target: ['pro'],
  },
  bookingRemind: {
    label: '予約のリマインド',
    target: ['pro', 'user'],
  },
  newChat: {
    label: 'チャットメッセージ',
    target: ['pro', 'user'],
  },
  pointGet: {
    label: 'ポイントの購入・獲得・返還',
    target: ['pro'],
  },
  lowBudget: {
    label: '予算が少なくなりました',
    target: ['pro'],
    isMatchMore: true,
  },
}

export default notificationTypes

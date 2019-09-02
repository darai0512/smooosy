const MeetStatusType = {
  DELETED: 'deleted',
  CANCELED: 'canceled',
  HIRED: 'hired',
  EXCLUDED: 'excluded',
  CLOSED: 'closed',
  UNREAD: 'unread',
  RESPONDED: 'responded',
  READ: 'read',
  HAS_PHONE_NUM: 'hasPhoneNum',
}

/**
 * @function getMeetStatus The function instead of statusForAdmin
 * @param {Object} meet
 *   @param {String} meet.status
 *   @param {String} meet.chatStatus
 *   @param {dateFormat} meet.hiredAt
 *   @param {Object} meet.request Must be populated
 *    @param {String} meet.request.status
 *    @param {Boolean} meet.request.deleted
 */
MeetStatusType.getMeetStatus = (meet) => {
  const request = meet.request

  if (request.deleted) {
    // 削除
    return MeetStatusType.DELETED
  } else if (request.status === 'suspend') {
    // キャンセル
    return MeetStatusType.CANCELED
  } else if (['progress', 'done'].includes(meet.status) || meet.hiredAt) {
    // 成約
    return MeetStatusType.HIRED
  } else if (meet.status === 'exclude') {
    // 除外
    return MeetStatusType.EXCLUDED
  } else if (request.status === 'close') {
    // 他プロ
    return MeetStatusType.CLOSED
  }
  return meet.chatStatus
}

export default MeetStatusType

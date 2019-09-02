module.exports = {
  order: {
    netbank: `
<?xml version="1.0" encoding="ISO-8859-1" ?>
<Epsilon_result>
  <result result="1" />
  <result redirect="https%3A%2F%2Fbeta.epsilon.jp%2Fcgi-bin%2Forder%2Fmethod_select3.cgi%3Ftrans_code%3DOfr915dhtcs86" />
</Epsilon_result>`,
    conveni: `
<?xml version="1.0" encoding="ISO-8859-1" ?>
<Epsilon_result>
  <result result="1" />
  <result trans_code="711561" />
  <result order_number="5ad8580d755b8c88010127ee" />
  <result state="0" />
  <result user_id="58ccc7a7e94aa8b63054ffac" />
  <result user_name="%95%BF%E0V%20%8Ej%96%E7" />
  <result process_code="1" />
  <result last_update="2018-04-19%2017%3A49%3A19" />
  <result item_price="2916" />
  <result memo1="20" />
  <result memo2="" />
  <result mission_code="1" />
  <result st_code="00100-0000-00000-00000-00000-00000-00000" />
  <result contract_code="66065390" />
  <result item_name="%83~%83c%83%82%83A%83%7C%83C%83%93%83g%2020pt" />
  <result payment_code="3" />
  <result user_mail_add="krswfmy%40gmail.com" />
  <result item_code="20PT2916YEN" />
  <result conveni_code="31" />
  <result receipt_no="004538" />
  <result kigyou_code="00010" />
  <result haraikomi_url="http%3A%2F%2Fbeta.epsilon.jp%2Fsample%2Fecon_sample.pdf" />
  <result paid="0" />
  <result receipt_date="2018-04-19%2017%3A49%3A19" />
  <result conveni_limit="2018-04-29" />
  <result conveni_time="" />
</Epsilon_result>`,
    error: `
<?xml version="1.0" encoding="x-sjis-cp932"?>
<Epsilon_result>
  <result acsurl="" />
  <result err_code="908" />
  <result err_detail="%82%B1%82%CCCGI%82%F0%8E%C0%8Ds%82%B7%82%E9%8C%A0%8C%C0%82%AA%82%A0%82%E8%82%DC%82%B9%82%F1" />
  <result pareq="" />
  <result result="9" />
  <result trans_code="" />
</Epsilon_result>`,
  },
  sales: {
    netbank: ({user_id, payment_code, order_number}) => `
<?xml version="1.0" encoding="x-sjis-cp932" ?>
<Epsilon_result>
  <result last_update="2018-04-27+18%3A53%3A22" />
  <result user_mail_add="krswfmy%40gmail.com" />
  <result conveni_limit="2018-04-30" />
  <result state="1" />
  <result trans_code="713877" />
  <result mission_code="1" />
  <result item_price="2916" />
  <result payment_code="${payment_code || '4'}" />
  <result item_code="20PT2916YEN" />
  <result order_number="${order_number || '5ae2f3e631f8b2034f2aa903'}" />
  <result st_code="00001-0000-00000-00000-00000-00000-00000" />
  <result memo1="20" />
  <result contract_code="66065390" />
  <result item_name="%83%7E%83c%83%82%83A%83%7C%83C%83%93%83g+20pt" />
  <result user_name="%95%BF%E0V+%8Ej%96%E7" />
  <result process_code="1" />
  <result keitai="0" />
  <result due_date="" />
  <result add_info="" />
  <result user_id="${user_id || '58ccc7a7e94aa8b63054ffac'}" />
  <result memo2="%2Faccount%2Fpoints" />
</Epsilon_result>`,
    conveni: `
<?xml version="1.0" encoding="x-sjis-cp932" ?>
<Epsilon_result>
  <result last_update="2018-04-20+03%3A07%3A35" />
  <result user_mail_add="krswfmy%40gmail.com" />
  <result conveni_limit="2018-04-30" />
  <result state="1" />
  <result trans_code="711561" />
  <result receipt_date="2018-04-20+03%3A07%3A35" />
  <result mission_code="1" />
  <result item_price="2916" />
  <result payment_code="3" />
  <result item_code="20PT2916YEN" />
  <result receipt_no="004538" />
  <result order_number="5ad8580d755b8c88010127ee" />
  <result conveni_time="2018-04-20+03%3A08%3A35" />
  <result st_code="00100-0000-00000-00000-00000-00000-00000" />
  <result memo1="20" />
  <result contract_code="66065390" />
  <result item_name="%83%7E%83c%83%82%83A%83%7C%83C%83%93%83g+20pt" />
  <result user_name="%95%BF%E0V+%8Ej%96%E7" />
  <result paid="1" />
  <result haraikomi_url="http%3A%2F%2Fbeta.epsilon.jp%2Fsample%2Fecon_sample.pdf" />
  <result conveni_code="31" />
  <result kigyou_code="00010" />
  <result process_code="1" />
  <result keitai="" />
  <result due_date="" />
  <result add_info="" />
  <result user_id="58ccc7a7e94aa8b63054ffac" />
  <result memo2="" />
</Epsilon_result>`,
  },
}

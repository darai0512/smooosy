# resizerについて

`/img/*`へのアクセスはすべて8080ポートに流しています。

s3から取得した画像を`ngx_http_image_filter_module`を用いてcrop or resizeして返します。

本番環境はCloudFrontにて30日キャッシュを効かせています。
このキャッシュはクエリパラメータを含めたURL完全一致となっているので`updatedAt`やサイズが変わればキャッシュは利用されません。

## パラメータの指定方法
`src/models/*`において`?unixtime`クエリパラメータ付きのURLが取得されます。
このURLの後ろに変換パラメータを、`w, h, t`の順番で指定します。

```
&w=320&h=320
&w=320&h=320&t=r
&w=-&h=320&t=r
```

CloudFrontのキャッシュヒットを増やすために順番を前後させないでください。

`w`と`h`は必須となっています。数字または'-'を指定できます。

'-'は`w`と`h`の片方にしか指定できません。
'-'はもう一方のサイズ指定のみを効かせるオプションです。

`t`(type)は'r'のみ指定できます。'r'を指定するとcropせず`w, h`に収まるようにアスペクト比を保ってリサイズされます。
'r'以外は無視されます。
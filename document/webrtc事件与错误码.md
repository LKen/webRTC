# Webrtc

## 连接(connection)

使用带`namespace`和`query`的连接方式

```js
/* client */
this.socket = io.connect(http://xxxxxx:2100/chat, {
    query: {
        name: <用户名>唯一
    }
})
```

**注意**，如果不带query参数或者name重复的时候，会抛出socket连接错误，连接失败

```js
this.socket.on('error', (err) => {})
```



## 事件(Event)

**`update`**

每有用户**加入**或者用户**离开**，便会把最新的用户列表广播到所有`sockets`

```js
/* server */
socket.send({ event: 'update', message: <Array>userlist })
```



**`call`**

电话呼叫对方的事件，60s超时

```js
/* client */
/**
 * 发送的数据需要JSON格式
 * uuid 每个用户的唯一id，通过userlist获取
 */
socket.send(JSON.stringify({ event: 'call', message: <String>uuid }))
```



**`accept`**

是否接受通话的事件

```js
/* client */
/**
 * 发送的数据需要JSON格式
 * uuid 每个用户的唯一id，通过userlist获取
 * success 传入Booleen，true:接受，false:不接受
 */
socket.send(JSON.stringify({ event: 'accept', message: <String>uuid, success: <Boolean>true }))
```



**`hangup`**

挂断**已拨通**电话

```js
socket.send(JSON.stringify({ event: 'hangup' }))
```



`offer`**

webrtc建立连接协议

```js
socket.send(JSON.stringify({ event: 'offer', message:<Object> offer }))
```



`answer`**

webrtc建立连接协议

```js
socket.send(JSON.stringify({ event: 'answer', message:<Object> answer }))
```



**`candicade`**

webrtc建立连接协议

```js
socket.send(JSON.stringify({ event: 'candidate', message:<Object> candidate }))
```



**`reject`**

业务错误反馈事件，接受业务错误状态码，用于提示



**`error`**

参数错误反馈事件，接受错误状态码，用于提示



## 错误状态码

**Reject**(事件)

>  '5001': '对方正在通话',
>
>  '5002': '对方已挂断',
>
>  '5003': '对方不存在',
>
>  '5004': '正在拨打中，请勿重复拨打',
>
>  '5005': '当前用户不在通话中，错误请求',
>
>  '5006': '对方拒绝通话',
>
>  '5007': '对方正忙，请稍后在拨'



**Error**(事件)

>  '5101': '参数格式无效（json）',
>
>  '5102': '缺少uuid',
>
>  '5103': '无效事件'


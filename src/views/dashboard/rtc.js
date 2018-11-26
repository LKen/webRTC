/* eslint-disable */
// handles JSON.stringify/parse
const signaling = new SignalingChannel()
const constraints = { audio: true, video: true }
const configuration = { iceServers: [{ urls: 'stuns:stun.example.org' }] }
const pc = new RTCPeerConnection(configuration)

// send any ice candidates to the other peer
pc.onicecandidate = ({ candidate }) => signaling.send({ candidate })

// let the "negotiationneeded" event trigger offer generation 
// 该函数negotiationneeded在RTCPeerConnection实例上发生时被调用以处理该事件。发生需要会话协商的更改时会触发此事件。此协商应作为提议者进行，因为某些会话更改无法作为回答者进行协商
pc.onnegotiationneeded = async() => {
  try {
    // createOffer The return from this of this is passed an RTCSessionDescription
    await pc.setLocalDescription(await pc.createOffer())
    // send the offer to the other peer
    signaling.send({ desc: pc.localDescription })
  } catch (err) {
    console.error(err)
  }
}

// once remote track media arrives, show it in remote video element
pc.ontrack = (event) => {
  // don't set srcObject again if it is already set.
  if (remoteView.srcObject) return
  remoteView.srcObject = event.streams[0]
}

// call start() to initiate
async function start() {
  try {
    // get local stream, show it in self-view and add it to be sent
    const stream =
      await navigator.mediaDevices.getUserMedia(constraints)
    stream.getTracks().forEach((track) =>
      pc.addTrack(track, stream))
    selfView.srcObject = stream
  } catch (err) {
    console.error(err)
  }
}

signaling.onmessage = async({ desc, candidate }) => {
  try {
    if (desc) {
      // if we get an offer, we need to reply with an answer
      if (desc.type === 'offer') {
        await pc.setRemoteDescription(desc)
        const stream =
          await navigator.mediaDevices.getUserMedia(constraints)
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))
        // createAnswer will return a RTCSessionDescription
        await pc.setLocalDescription(await pc.createAnswer())
        signaling.send({ desc: pc.localDescription })
      } else if (desc.type === 'answer') {
        await pc.setRemoteDescription(desc)
      } else {
        console.log('Unsupported SDP type.')
      }
    } else if (candidate) {
      await pc.addIceCandidate(candidate)
    }
  } catch (err) {
    console.error(err)
  }
}

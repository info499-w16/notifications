import {default as dgram} from 'dgram'
import {default as uuid} from 'uuid'

export {getPylon}

const client = dgram.createSocket('udp4')
export default function heartbeat (name, version, heartRate = 30000, port = 8888) {
  client.bind(port, () => {
    client.setBroadcast(true)

    const instanceData = JSON.stringify({
      name,
      version,
      id: uuid.v4()
    })

    function sendRegistrationData () {
      client.send(instanceData, 0, instanceData.length, port, '255.255.255.255', (err) => {
        if (err) throw err
      })
    }

    sendRegistrationData()
    setInterval(sendRegistrationData, heartRate)
  })
}

// Listen for pylon broadcast to make a request
const PYLON_PORT = process.env.PYLON_PORT || 9999

let pylonAddress
let pylonPort

const pylonListener = dgram.createSocket('udp4')
pylonListener.on('error', (err) => {
  console.log(`Registry error:\n${err.stack}`)
  pylonListener.close()
})

pylonListener.on('message', (msg, rinfo) => {
  console.log(`Recieved pylon broadcast from ${rinfo.address}:${rinfo.port}`)
  // Set pylon's address to the value recieved
  pylonAddress = rinfo.address
  // Pylon ALSO needs to address it's port if it isn't running on port 80
})

pylonListener.on('listening', () => {
  var address = pylonListener.address()
  console.log(`Waiting for pylon broadcast: listening ${address.address}:${address.port}`)
})

pylonListener.bind(PYLON_PORT)

function getPylon () { return `http://${pylonAddress}:3000` }

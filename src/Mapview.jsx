import { useEffect, useState } from 'react'
import { Popup, Marker,  TileLayer, MapContainer, } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import{ Icon } from 'leaflet'

const iconeCustomizado = new Icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/5591/5591266.png',
iconSize:[38,38],
})

export default function MapView() {
  const [equipamentos, setEquipamentos] = useState([])
  const [selecionado, setSelecionado] = useState()

  useEffect(() => {

    async function carregarDados() {
      const arquivos = [
        'equipment.json',
        'equipmentModel.json',
        'equipmentState.json',
        'equipmentStateHistory.json',
        'equipmentPositionHistory.json'
      ]

    const valores = await Promise.all(
      arquivos.map(nome => fetch(`/data/${nome}`).then(res => res.json()))
    )
    // console.log('JSONs carregados:', valores)

    const equipmento = valores[0]
    const estadosEquipamento = valores[2]
    const historicoEstados = valores[3]
    const historicoPosicaoEquip = valores[4]

      const dados = equipmento.map(equip => {
        const posicoes = historicoPosicaoEquip.find(equipPH => equipPH.equipmentId === equip.id).positions 
        const ultimaPosicao = posicoes.reduce((primeiraPosicao, atual) =>
          new Date(primeiraPosicao.date) > new Date(atual.date) ? primeiraPosicao : atual
        )
        const data = new Date(ultimaPosicao.date)
        const dataFormatada = `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

        const historicoDoEquip = historicoEstados.find(historicoEquip => historicoEquip.equipmentId === equip.id).states 
        const ultimoEstadoBruto = historicoDoEquip.reduce((anterior, atual) =>
          new Date(anterior.date) > new Date(atual.date) ? anterior : atual, { date: '1970-01-01T00:00:00.000Z' }
        )
        const estadoAtual = estadosEquipamento.find(estado => estado.id === ultimoEstadoBruto.equipmentStateId) 

        return {
          id: equip.id,
          nome: equip.name,
          lat: ultimaPosicao.lat,
          lon: ultimaPosicao.lon,
          data: dataFormatada,
          estado: estadoAtual.name,
          corEstado: estadoAtual.color,
          historico: historicoDoEquip.map(h => {
            const estado = estadosEquipamento.find(e => e.id === h.equipmentStateId)
            const dataNova = new Date(h.date)
            return {
              data: `${dataNova.toLocaleDateString('pt-BR')} às ${dataNova.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
              nome: estado.name,
              cor: estado.color 
            }
          })
        }
      })
      // console.log('Equipamentos:', dados)
      setEquipamentos(dados)

    }

    carregarDados()

  }, [])

  return (
  <div style={{ display: 'flex', height: '100%' }}>
      <MapContainer center={[-19.2, -46.0]} zoom={8} style={{ flex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {equipamentos.map((equipamento, index) => (
          <Marker
            key={index}
            position={[equipamento.lat, equipamento.lon]}
            icon={iconeCustomizado}
            eventHandlers={{
              mouseover: (e) => e.target.openPopup(),
              mouseout: (e) => e.target.closePopup(),
              click: () => setSelecionado(equipamento)
            }}
          >
            <Popup style={{marginBottom: '8px'}}>
              <div >
                <div><strong>ID:</strong> {equipamento.id}</div>
                <div><strong>Posição:</strong> {equipamento.lat}, {equipamento.lon}</div>
                <div><strong>Estado:</strong> <span style={{ color: equipamento.corEstado }}>{equipamento.estado}</span></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selecionado && (
        <div style={{ width: '400px', padding: '24px', overflowY: 'auto' }}>
          <h2>{selecionado.nome}</h2>
          <p><strong>ID:</strong> {selecionado.id}</p>
          <p><strong>Última posição registrada:</strong> {selecionado.data}</p>
          <p><strong>Estado atual:</strong> <span style={{ color: selecionado.corEstado }}>{selecionado.estado}</span></p>
          <hr />
          <h3>Histórico de estados</h3>
          <ul style={{ paddingLeft: '32px',  }}>
            {selecionado.historico.slice().reverse().map((item, index) => (
              <li key={index} style={{ color: item.cor, paddingBottom: '16px' }}>{item.nome} — {item.data}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

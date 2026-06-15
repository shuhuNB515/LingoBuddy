package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Client represents a connected WebSocket client
type Client struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

// Hub manages all connected clients
type Hub struct {
	clients map[*Client]bool
	mu      sync.RWMutex
}

var hub = &Hub{
	clients: make(map[*Client]bool),
}

func (h *Hub) register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[client] = true
}

func (h *Hub) unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, client)
}

// SignalMessage represents a WebRTC signaling message
type SignalMessage struct {
	Type       string          `json:"type"`
	ScenarioID string          `json:"scenarioId,omitempty"`
	SDP        json.RawMessage `json:"sdp,omitempty"`
	Candidate  json.RawMessage `json:"candidate,omitempty"`
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{conn: conn}
	hub.register(client)
	defer func() {
		hub.unregister(client)
		conn.Close()
	}()

	log.Printf("Client connected: %s", conn.RemoteAddr())

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		var msg SignalMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("JSON unmarshal error: %v", err)
			continue
		}

		switch msg.Type {
		case "offer":
			log.Printf("Received offer for scenario: %s", msg.ScenarioID)
			// Forward to AI engine and relay answer back
			handleOffer(client, &msg)
		case "ice-candidate":
			log.Printf("Received ICE candidate")
			// Relay ICE candidate to AI engine
			handleICECandidate(client, &msg)
		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}

func handleOffer(client *Client, msg *SignalMessage) {
	// TODO: Forward SDP offer to AI engine service
	// For now, send a mock answer back
	answer := map[string]interface{}{
		"type": "answer",
		"sdp": map[string]string{
			"type": "answer",
			"sdp":  "mock-answer-sdp",
		},
	}
	sendToClient(client, answer)
}

func handleICECandidate(client *Client, msg *SignalMessage) {
	// TODO: Forward ICE candidate to AI engine
}

func sendToClient(client *Client, data interface{}) {
	client.mu.Lock()
	defer client.mu.Unlock()
	msg, err := json.Marshal(data)
	if err != nil {
		log.Printf("JSON marshal error: %v", err)
		return
	}
	if err := client.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
		log.Printf("Write error: %v", err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "ok")
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handleWebSocket)
	mux.HandleFunc("/health", handleHealth)

	handler := cors.Default().Handler(mux)

	addr := ":8080"
	log.Printf("LingoBuddy signaling server starting on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

import SwiftUI

struct GameDetailView: View {
    let gameId: String
    
    // This would be fetched from your database based on the gameId
    let gameDetails = GameDetails(
        id: "1",
        group: "Friday Night Poker",
        date: "May 15, 2025",
        stakes: "$0.50/$1",
        buyIn: 200,
        bankPerson: "You",
        players: [
            Player(id: "1", name: "You", initials: "JP", buyIn: 200, cashOut: 285, profit: 85),
            Player(id: "2", name: "Mike", initials: "MS", buyIn: 200, cashOut: 115, profit: -85),
            Player(id: "3", name: "Sarah", initials: "SL", buyIn: 200, cashOut: 40, profit: -160),
            Player(id: "4", name: "Alex", initials: "AK", buyIn: 200, cashOut: 320, profit: 120),
            Player(id: "5", name: "Tom", initials: "TW", buyIn: 200, cashOut: 80, profit: -120)
        ],
        settlements: [
            Settlement(from: "Mike", to: "You", amount: 85),
            Settlement(from: "Sarah", to: "Alex", amount: 120),
            Settlement(from: "Sarah", to: "You", amount: 40),
            Settlement(from: "Tom", to: "Alex", amount: 120)
        ]
    )
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Game header
                VStack(alignment: .leading, spacing: 4) {
                    Text(gameDetails.group)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(gameDetails.date)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
                
                // Game details
                VStack(spacing: 12) {
                    HStack {
                        GameInfoCard(title: "Stakes", value: gameDetails.stakes)
                        GameInfoCard(title: "Buy-in", value: "$\(gameDetails.buyIn)")
                    }
                    
                    HStack {
                        GameInfoCard(title: "Bank Person", value: gameDetails.bankPerson)
                        GameInfoCard(title: "Status", value: "Balanced", isStatus: true)
                    }
                }
                .padding(.horizontal)
                
                // Player results
                VStack(alignment: .leading, spacing: 12) {
                    Text("Player Results")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    ForEach(gameDetails.players, id: \.id) { player in
                        PlayerResultRow(player: player)
                    }
                }
                
                // Settlements
                VStack(alignment: .leading, spacing: 12) {
                    Text("Settlements")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    ForEach(gameDetails.settlements, id: \.id) { settlement in
                        SettlementRow(settlement: settlement)
                    }
                }
                .padding(.bottom)
            }
            .padding(.vertical)
        }
        .navigationTitle("Game Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {}) {
                    Text("Edit")
                }
            }
        }
    }
}

struct GameInfoCard: View {
    let title: String
    let value: String
    var isStatus: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            if isStatus {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .foregroundColor(.green)
                    .cornerRadius(4)
            } else {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

struct PlayerResultRow: View {
    let player: Player
    
    var body: some View {
        HStack {
            ZStack {
                Circle()
                    .fill(Color(.systemGray5))
                    .frame(width: 32, height: 32)
                Text(player.initials)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            
            Text(player.name)
                .font(.subheadline)
                .fontWeight(.medium)
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                HStack(spacing: 4) {
                    Text("In:")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("$\(player.buyIn)")
                        .font(.caption)
                }
                
                HStack(spacing: 4) {
                    Text("Out:")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("$\(player.cashOut)")
                        .font(.caption)
                }
                
                HStack(spacing: 4) {
                    Text("P/L:")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(player.profit > 0 ? "+$\(player.profit)" : "-$\(abs(player.profit))")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(player.profit > 0 ? .green : .red)
                }
            }
        }
        .padding(10)
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color(.systemGray4), lineWidth: 1)
        )
        .padding(.horizontal)
    }
}

struct SettlementRow: View {
    let settlement: Settlement
    
    var body: some View {
        HStack {
            Image(systemName: "dollarsign.circle.fill")
                .foregroundColor(.blue)
                .font(.caption)
            
            Text("\(settlement.from) should pay \(settlement.to)")
                .font(.caption)
            
            Spacer()
            
            Text("$\(String(format: "%.2f", settlement.amount))")
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding(10)
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .padding(.horizontal)
    }
}

struct GameDetails {
    let id: String
    let group: String
    let date: String
    let stakes: String
    let buyIn: Int
    let bankPerson: String
    let players: [Player]
    let settlements: [Settlement]
}

struct Player {
    let id: String
    let name: String
    let initials: String
    let buyIn: Int
    let cashOut: Int
    let profit: Int
}

struct Settlement: Identifiable {
    let id = UUID()
    let from: String
    let to: String
    let amount: Int
}

struct GameDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GameDetailView(gameId: "1")
        }
    }
}

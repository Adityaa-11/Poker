import SwiftUI

struct DashboardView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    BalanceSummaryCard()
                    
                    RecentGamesCard()
                    
                    Button(action: {
                        // Show create game sheet
                    }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("New Game")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("PokerPals")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {}) {
                        Image(systemName: "bell")
                    }
                }
            }
        }
    }
}

struct BalanceSummaryCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Balance Summary")
                .font(.headline)
            
            HStack {
                Text("Total Profit/Loss:")
                Spacer()
                Text("+$125.00")
                    .foregroundColor(.green)
                    .fontWeight(.bold)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("You are owed:")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                ForEach(["Mike owes you $85.00", "Sarah owes you $160.00"], id: \.self) { debt in
                    HStack {
                        Image(systemName: "dollarsign.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        Text(debt)
                            .font(.caption)
                        Spacer()
                    }
                    .padding(6)
                    .background(Color(.systemGray6))
                    .cornerRadius(6)
                }
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("You owe:")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(.red)
                        .font(.caption)
                    Text("You owe Alex $120.00")
                        .font(.caption)
                    Spacer()
                }
                .padding(6)
                .background(Color(.systemGray6))
                .cornerRadius(6)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        .padding(.horizontal)
    }
}

struct RecentGamesCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Games")
                .font(.headline)
            
            ForEach(0..<3) { index in
                NavigationLink(destination: GameDetailView(gameId: "\(index + 1)")) {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(index == 0 ? "Friday Night Poker" : (index == 1 ? "Sunday Game" : "Friday Night Poker"))
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .lineLimit(1)
                            
                            Spacer()
                            
                            Text(index == 0 ? "$0.50/$1" : (index == 1 ? "$1/$2" : "$0.50/$1"))
                                .font(.caption)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color(.systemGray6))
                                .cornerRadius(4)
                        }
                        
                        HStack {
                            Image(systemName: "calendar")
                                .font(.caption2)
                            Text(index == 0 ? "May 15, 2025" : (index == 1 ? "May 10, 2025" : "May 8, 2025"))
                                .font(.caption)
                            Spacer()
                            Text(index == 0 ? "+$85.00" : (index == 1 ? "-$120.00" : "+$160.00"))
                                .fontWeight(.bold)
                                .font(.subheadline)
                                .foregroundColor(index == 1 ? .red : .green)
                        }
                        .foregroundColor(.secondary)
                    }
                    .padding(10)
                    .background(Color(.systemBackground))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.systemGray4), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        .padding(.horizontal)
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}

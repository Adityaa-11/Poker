import SwiftUI

struct SettleUpView: View {
    @State private var selectedTab = 0
    
    let youOwe = [
        (id: "1", name: "Alex", initials: "AK", amount: 120.0)
    ]
    
    let owesYou = [
        (id: "1", name: "Mike", initials: "MS", amount: 85.0),
        (id: "2", name: "Sarah", initials: "SL", amount: 160.0)
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Balance summary
                VStack(spacing: 16) {
                    HStack {
                        BalanceCard(
                            title: "Total owed to you",
                            amount: 245.0,
                            isPositive: true
                        )
                        
                        BalanceCard(
                            title: "Total you owe",
                            amount: 120.0,
                            isPositive: false
                        )
                    }
                    
                    Picker("View", selection: $selectedTab) {
                        Text("You Owe").tag(0)
                        Text("Owes You").tag(1)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                .padding()
                .background(Color(.systemBackground))
                
                // Tab content
                if selectedTab == 0 {
                    List {
                        ForEach(youOwe, id: \.id) { debt in
                            DebtRow(
                                name: debt.name,
                                initials: debt.initials,
                                amount: debt.amount,
                                isOwedToYou: false
                            )
                        }
                    }
                    .listStyle(InsetGroupedListStyle())
                } else {
                    List {
                        ForEach(owesYou, id: \.id) { debt in
                            DebtRow(
                                name: debt.name,
                                initials: debt.initials,
                                amount: debt.amount,
                                isOwedToYou: true
                            )
                        }
                    }
                    .listStyle(InsetGroupedListStyle())
                }
            }
            .navigationTitle("Settle Up")
        }
    }
}

struct BalanceCard: View {
    let title: String
    let amount: Double
    let isPositive: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .foregroundColor(isPositive ? .green : .red)
            
            Text(isPositive ? "+$\(String(format: "%.2f", amount))" : "-$\(String(format: "%.2f", amount))")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(isPositive ? .green : .red)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(isPositive ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isPositive ? Color.green.opacity(0.3) : Color.red.opacity(0.3), lineWidth: 1)
        )
    }
}

struct DebtRow: View {
    let name: String
    let initials: String
    let amount: Double
    let isOwedToYou: Bool
    
    var body: some View {
        HStack {
            ZStack {
                Circle()
                    .fill(Color(.systemGray5))
                    .frame(width: 32, height: 32)
                Text(initials)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(isOwedToYou ? "Owes you $\(String(format: "%.2f", amount))" : "You owe $\(String(format: "%.2f", amount))")
                    .font(.caption)
                    .foregroundColor(isOwedToYou ? .green : .red)
            }
            
            Spacer()
            
            Button(action: {}) {
                Text(isOwedToYou ? "Mark Paid" : "Pay")
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(isOwedToYou ? Color(.systemGray5) : Color.blue)
                    .foregroundColor(isOwedToYou ? .primary : .white)
                    .cornerRadius(6)
            }
        }
        .padding(.vertical, 4)
    }
}

struct SettleUpView_Previews: PreviewProvider {
    static var previews: some View {
        SettleUpView()
    }
}

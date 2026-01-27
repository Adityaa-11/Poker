import SwiftUI

struct GroupDetailView: View {
    let groupId: String
    @State private var selectedTab = 0
    @State private var showingInviteSheet = false
    @State private var showingNewGameSheet = false
    
    var groupName: String {
        groupId == "friday-night" ? "Friday Night Poker" : "Sunday Game"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Group header
            VStack(spacing: 16) {
                HStack {
                    Text(groupName)
                        .font(.title)
                        .fontWeight(.bold)
                    Spacer()
                    
                    Menu {
                        Button(action: {
                            showingInviteSheet = true
                        }) {
                            Label("Invite Friends", systemImage: "person.badge.plus")
                        }
                        
                        Button(action: {}) {
                            Label("Group Settings", systemImage: "gear")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.title3)
                    }
                }
                
                Button(action: {
                    showingNewGameSheet = true
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
            }
            .padding()
            .background(Color(.systemBackground))
            
            // Tab selector
            Picker("View", selection: $selectedTab) {
                Text("Members").tag(0)
                Text("Games").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            
            // Tab content
            if selectedTab == 0 {
                MembersTabView()
            } else {
                GamesTabView(groupId: groupId)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingInviteSheet) {
            InviteView(groupId: groupId, groupName: groupName)
        }
        .sheet(isPresented: $showingNewGameSheet) {
            CreateGameView(groupId: groupId, groupName: groupName)
        }
    }
}

struct MembersTabView: View {
    let members = [
        (name: "You", initials: "JP", balance: 245.0, isBank: true),
        (name: "Mike", initials: "MS", balance: -85.0, isBank: false),
        (name: "Sarah", initials: "SL", balance: -160.0, isBank: false),
        (name: "Alex", initials: "AK", balance: 120.0, isBank: false),
        (name: "Tom", initials: "TW", balance: -120.0, isBank: false)
    ]
    
    var body: some View {
        List {
            ForEach(members, id: \.name) { member in
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color(.systemGray5))
                            .frame(width: 36, height: 36)
                        Text(member.initials)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(member.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            if member.isBank {
                                Text("Bank")
                                    .font(.caption2)
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 1)
                                    .background(Color(.systemGray6))
                                    .cornerRadius(2)
                            }
                        }
                        
                        Text(member.balance > 0 ? "Up $\(String(format: "%.2f", abs(member.balance)))" : "Down $\(String(format: "%.2f", abs(member.balance)))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Text(member.balance > 0 ? "+$\(String(format: "%.2f", member.balance))" : "-$\(String(format: "%.2f", abs(member.balance)))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(member.balance > 0 ? .green : .red)
                }
                .padding(.vertical, 2)
            }
        }
    }
}

struct GamesTabView: View {
    let groupId: String
    
    let games = [
        (id: "1", date: "May 15, 2025", stakes: "$0.50/$1", buyIn: 200),
        (id: "2", date: "May 8, 2025", stakes: "$0.50/$1", buyIn: 200),
        (id: "3", date: "May 1, 2025", stakes: "$0.50/$1", buyIn: 200),
        (id: "4", date: "Apr 24, 2025", stakes: "$0.25/$0.50", buyIn: 100)
    ]
    
    var body: some View {
        List {
            ForEach(games, id: \.id) { game in
                NavigationLink(destination: GameDetailView(gameId: game.id)) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(game.date)
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        HStack {
                            Text("Stakes: \(game.stakes)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Text("•")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Text("Buy-in: $\(game.buyIn)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }
}

struct InviteView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Image(systemName: "link.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.blue)
                
                Text("Invite Friends to \(groupName)")
                    .font(.headline)
                    .fontWeight(.bold)
                
                Text("Share this link with your friends")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                HStack {
                    Text("pokerpal.app/join/\(groupId)")
                        .font(.system(.caption, design: .monospaced))
                        .padding(8)
                        .background(Color(.systemGray6))
                        .cornerRadius(6)
                    
                    Button(action: {
                        // Copy to clipboard
                    }) {
                        Image(systemName: "doc.on.doc")
                            .padding(8)
                            .background(Color(.systemGray6))
                            .cornerRadius(6)
                    }
                }
                
                Button(action: {
                    // Share link
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Share Invite Link")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                trailing: Button("Done") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
}

struct CreateGameView: View {
    let groupId: String
    let groupName: String
    @Environment(\.presentationMode) var presentationMode
    @State private var stakes = 1
    @State private var buyIn = "200"
    @State private var bankPerson = 0
    
    let stakesOptions = ["$0.25/$0.50", "$0.50/$1", "$1/$2", "$2/$5"]
    let members = ["You", "Mike", "Sarah", "Alex", "Tom"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Game Details")) {
                    HStack {
                        Text("Group")
                        Spacer()
                        Text(groupName)
                            .foregroundColor(.secondary)
                    }
                    
                    Picker("Stakes", selection: $stakes) {
                        ForEach(0..<stakesOptions.count) { index in
                            Text(stakesOptions[index]).tag(index)
                        }
                    }
                    
                    TextField("Buy-in Amount", text: $buyIn)
                        .keyboardType(.numberPad)
                }
                
                Section(header: Text("Bank Person")) {
                    Picker("Bank Person", selection: $bankPerson) {
                        ForEach(0..<members.count) { index in
                            Text(members[index]).tag(index)
                        }
                    }
                }
                
                Section {
                    Button(action: {
                        // Create game logic
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Text("Start Game")
                            .frame(maxWidth: .infinity, alignment: .center)
                            .foregroundColor(.blue)
                    }
                }
            }
            .navigationTitle("New Game")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
}

struct GroupDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GroupDetailView(groupId: "friday-night")
        }
    }
}

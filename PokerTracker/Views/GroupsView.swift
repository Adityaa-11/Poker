import SwiftUI

struct GroupsView: View {
    @State private var showingCreateGroupSheet = false
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    ForEach(0..<2) { index in
                        NavigationLink(destination: GroupDetailView(groupId: index == 0 ? "friday-night" : "sunday-game")) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(index == 0 ? "Friday Night Poker" : "Sunday Game")
                                    .font(.headline)
                                
                                Text(index == 0 ? "5 members • Last game: 2 days ago" : "3 members • Last game: 1 week ago")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                HStack {
                                    Text("Your balance:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(index == 0 ? "+$245.00" : "-$120.00")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(index == 0 ? .green : .red)
                                }
                            }
                            .padding(.vertical, 8)
                        }
                    }
                } header: {
                    Text("Your Groups")
                }
                
                Section {
                    Button(action: {
                        showingCreateGroupSheet = true
                    }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.blue)
                            Text("Create New Group")
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Groups")
            .sheet(isPresented: $showingCreateGroupSheet) {
                CreateGroupView()
            }
        }
    }
}

struct CreateGroupView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var groupName = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Group Details")) {
                    TextField("Group Name", text: $groupName)
                }
                
                Section(header: Text("Stakes")) {
                    Picker("Default Stakes", selection: .constant(0)) {
                        Text("$0.25/$0.50").tag(0)
                        Text("$0.50/$1").tag(1)
                        Text("$1/$2").tag(2)
                        Text("$2/$5").tag(3)
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section(header: Text("Buy-in")) {
                    TextField("Default Buy-in", text: .constant("200"))
                        .keyboardType(.numberPad)
                }
            }
            .navigationTitle("Create Group")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Create") {
                    // Create group logic
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
}

struct GroupsView_Previews: PreviewProvider {
    static var previews: some View {
        GroupsView()
    }
}

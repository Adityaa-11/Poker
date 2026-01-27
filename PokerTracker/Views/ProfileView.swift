import SwiftUI

struct ProfileView: View {
    @State private var showingSettingsSheet = false
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    HStack {
                        ZStack {
                            Circle()
                                .fill(Color(.systemGray5))
                                .frame(width: 60, height: 60)
                            Text("JP")
                                .font(.title2)
                                .fontWeight(.medium)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("John Player")
                                .font(.headline)
                            
                            Text("john.player@example.com")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.leading, 8)
                    }
                    .padding(.vertical, 8)
                }
                
                Section(header: Text("Statistics")) {
                    StatRow(title: "Total Games", value: "24")
                    StatRow(title: "Win Rate", value: "58%")
                    StatRow(title: "Biggest Win", value: "+$345.00")
                    StatRow(title: "Biggest Loss", value: "-$210.00")
                    StatRow(title: "All-time Profit", value: "+$1,245.00")
                }
                
                Section {
                    Button(action: {
                        showingSettingsSheet = true
                    }) {
                        Label("Settings", systemImage: "gear")
                    }
                    
                    Button(action: {}) {
                        Label("Help & Support", systemImage: "questionmark.circle")
                    }
                    
                    Button(action: {}) {
                        Label("About", systemImage: "info.circle")
                    }
                }
                
                Section {
                    Button(action: {}) {
                        Text("Sign Out")
                            .foregroundColor(.red)
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Profile")
            .sheet(isPresented: $showingSettingsSheet) {
                SettingsView()
            }
        }
    }
}

struct StatRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 2)
    }
}

struct SettingsView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var notifications = true
    @State private var darkMode = false
    @State private var currency = 0
    
    let currencies = ["USD ($)", "EUR (€)", "GBP (£)"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Appearance")) {
                    Toggle("Dark Mode", isOn: $darkMode)
                }
                
                Section(header: Text("Notifications")) {
                    Toggle("Enable Notifications", isOn: $notifications)
                }
                
                Section(header: Text("Currency")) {
                    Picker("Currency", selection: $currency) {
                        ForEach(0..<currencies.count) { index in
                            Text(currencies[index]).tag(index)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section(header: Text("Privacy")) {
                    Button(action: {}) {
                        Text("Privacy Policy")
                    }
                    
                    Button(action: {}) {
                        Text("Terms of Service")
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                trailing: Button("Done") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
    }
}

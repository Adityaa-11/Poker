import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }
                .tag(0)
            
            GroupsView()
                .tabItem {
                    Label("Groups", systemImage: "person.3")
                }
                .tag(1)
            
            SettleUpView()
                .tabItem {
                    Label("Settle", systemImage: "dollarsign.circle")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
                .tag(3)
        }
        .accentColor(.blue)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

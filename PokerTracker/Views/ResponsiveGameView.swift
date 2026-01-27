import SwiftUI

struct ResponsiveGameView: View {
    @Environment(\.horizontalSizeClass) var sizeClass
    
    var body: some View {
        GeometryReader { geometry in
            if geometry.size.width < 375 {
                // Compact layout for smaller phones (iPhone SE, etc.)
                CompactGameView()
            } else {
                // Regular layout for standard and larger phones
                StandardGameView()
            }
        }
    }
}

struct CompactGameView: View {
    var body: some View {
        VStack(spacing: 8) {
            // More compact UI elements for smaller screens
            Text("Compact layout for smaller screens")
                .font(.caption)
        }
    }
}

struct StandardGameView: View {
    var body: some View {
        VStack(spacing: 12) {
            // Standard UI elements for regular screens
            Text("Standard layout for regular screens")
                .font(.body)
        }
    }
}

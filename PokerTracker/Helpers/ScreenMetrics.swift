import SwiftUI

struct ScreenMetrics {
    static let screenWidth = UIScreen.main.bounds.width
    static let screenHeight = UIScreen.main.bounds.height
    static let isSmallScreen = screenWidth < 375 // iPhone SE, 5s, etc.
    
    // Dynamic font sizes based on screen size
    static func fontSize(base: CGFloat) -> CGFloat {
        return isSmallScreen ? base - 2 : base
    }
    
    // Dynamic padding based on screen size
    static func padding(base: CGFloat) -> CGFloat {
        return isSmallScreen ? base * 0.75 : base
    }
}

// Extension to help with responsive design
extension View {
    func responsiveFont(size: CGFloat, weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: ScreenMetrics.fontSize(base: size), weight: weight))
    }
    
    func responsivePadding(_ edges: Edge.Set = .all, _ length: CGFloat? = nil) -> some View {
        if let length = length {
            return self.padding(edges, ScreenMetrics.padding(base: length))
        } else {
            return self.padding(edges)
        }
    }
}

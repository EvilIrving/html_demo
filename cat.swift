import SwiftUI
import SwiftData

// MARK: - Models

@Model
class Cat {
    var name: String
    var breed: String
    var age: Int
    var photoData: Data?
    
    init(name: String, breed: String, age: Int, photoData: Data? = nil) {
        self.name = name
        self.breed = breed
        self.age = age
        self.photoData = photoData
    }
}

// MARK: - ViewModels

@MainActor
class CatListViewModel: ObservableObject {
    @Query private var cats: [Cat]
    
    var catCount: Int {
        cats.count
    }
    
    func cat(at index: Int) -> Cat {
        cats[index]
    }
    
    func addCat(_ cat: Cat, context: ModelContext) {
        context.insert(cat)
    }
    
    func updateCat(_ cat: Cat) {
        // SwiftData automatically tracks changes to managed objects
    }
    
    func deleteCat(_ cat: Cat, context: ModelContext) {
        context.delete(cat)
    }
}

class CatDetailViewModel: ObservableObject {
    @Published var cat: Cat
    
    init(cat: Cat) {
        self.cat = cat
    }
    
    func updateCat(name: String, breed: String, age: Int, photoData: Data?) {
        cat.name = name
        cat.breed = breed
        cat.age = age
        cat.photoData = photoData
    }
}

// MARK: - Views

struct CatListView: View {
    @Environment(\.modelContext) private var context
    @StateObject private var viewModel = CatListViewModel()
    @State private var showingAddCat = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(0..<viewModel.catCount, id: \.self) { index in
                    let cat = viewModel.cat(at: index)
                    NavigationLink(destination: CatDetailView(viewModel: CatDetailViewModel(cat: cat))) {
                        HStack {
                            if let photoData = cat.photoData, let uiImage = UIImage(data: photoData) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .frame(width: 50, height: 50)
                                    .clipShape(Circle())
                            } else {
                                Image(systemName: "photo")
                                    .resizable()
                                    .frame(width: 50, height: 50)
                                    .foregroundColor(.gray)
                            }
                            Text(cat.name)
                        }
                    }
                }
                .onDelete(perform: deleteCats)
            }
            .navigationTitle("Cats")
            .toolbar {
                Button(action: { showingAddCat = true }) {
                    Image(systemName: "plus")
                }
            }
            .sheet(isPresented: $showingAddCat) {
                AddCatView(viewModel: viewModel)
            }
        }
    }
    
    private func deleteCats(at offsets: IndexSet) {
        for index in offsets {
            let cat = viewModel.cat(at: index)
            viewModel.deleteCat(cat, context: context)
        }
    }
}

struct CatDetailView: View {
    @ObservedObject var viewModel: CatDetailViewModel
    @State private var isEditing = false
    
    var body: some View {
        Form {
            Section {
                if let photoData = viewModel.cat.photoData, let uiImage = UIImage(data: photoData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                } else {
                    Image(systemName: "photo")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                        .foregroundColor(.gray)
                }
                Text("Name: \(viewModel.cat.name)")
                Text("Breed: \(viewModel.cat.breed)")
                Text("Age: \(viewModel.cat.age)")
            }
        }
        .navigationTitle(viewModel.cat.name)
        .toolbar {
            Button(action: { isEditing = true }) {
                Text("Edit")
            }
        }
        .sheet(isPresented: $isEditing) {
            EditCatView(viewModel: viewModel)
        }
    }
}

struct EditCatView: View {
    @ObservedObject var viewModel: CatDetailViewModel
    @Environment(\.presentationMode) var presentationMode
    @State private var name: String
    @State private var breed: String
    @State private var age: String
    @State private var image: UIImage?
    @State private var showingImagePicker = false
    
    init(viewModel: CatDetailViewModel) {
        self.viewModel = viewModel
        _name = State(initialValue: viewModel.cat.name)
        _breed = State(initialValue: viewModel.cat.breed)
        _age = State(initialValue: String(viewModel.cat.age))
        if let photoData = viewModel.cat.photoData {
            _image = State(initialValue: UIImage(data: photoData))
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Name", text: $name)
                TextField("Breed", text: $breed)
                TextField("Age", text: $age)
                
                Section(header: Text("Photo")) {
                    if let image = image {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(height: 200)
                    }
                    Button("Choose Photo") {
                        showingImagePicker = true
                    }
                }
            }
            .navigationTitle("Edit Cat")
            .toolbar {
                Button("Save") {
                    if let age = Int(age) {
                        viewModel.updateCat(name: name, breed: breed, age: age, photoData: image?.jpegData(compressionQuality: 0.8))
                    }
                    presentationMode.wrappedValue.dismiss()
                }
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $image)
            }
        }
    }
}

struct AddCatView: View {
    @ObservedObject var viewModel: CatListViewModel
    @Environment(\.presentationMode) var presentationMode
    @Environment(\.modelContext) private var context
    @State private var name = ""
    @State private var breed = ""
    @State private var age = ""
    @State private var image: UIImage?
    @State private var showingImagePicker = false
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Name", text: $name)
                TextField("Breed", text: $breed)
                TextField("Age", text: $age)
                
                Section(header: Text("Photo")) {
                    if let image = image {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(height: 200)
                    }
                    Button("Choose Photo") {
                        showingImagePicker = true
                    }
                }
            }
            .navigationTitle("Add Cat")
            .toolbar {
                Button("Save") {
                    if let age = Int(age) {
                        let newCat = Cat(name: name, breed: breed, age: age, photoData: image?.jpegData(compressionQuality: 0.8))
                        viewModel.addCat(newCat, context: context)
                    }
                    presentationMode.wrappedValue.dismiss()
                }
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $image)
            }
        }
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let uiImage = info[.originalImage] as? UIImage {
                parent.image = uiImage
            }
            
            picker.dismiss(animated: true)
        }
    }
}

// MARK: - App

@main
struct CatApp: App {
    var body: some Scene {
        WindowGroup {
            CatListView()
        }
        .modelContainer(for: Cat.self)
    }
}
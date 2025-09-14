// Footer component
// Site footer with links, contact info, and social media

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-gray-300">
            © {currentYear} My Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
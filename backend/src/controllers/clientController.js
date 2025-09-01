import Client from "../models/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function createClient(req, res) {
  try {
    const { username, password, name, phoneNumber, email, gender, age, address } = req.body;

    if (!username || !password || !name || !phoneNumber || !email || !gender || !age || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

    const client = new Client({ username, password: hashedPassword, name, phoneNumber, email, gender, age, address });
    const savedClient = await client.save();

    res.status(201).json(savedClient);
  } catch (err) {
    console.error("Error in createClient controller", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function getAllClients(req, res) {
  try{
    const clients = await Client.find();

    if (!clients.length){
      return res.status(404).json({message: "No clients found"});
    }

    res.json(clients);

  }catch(err){
    console.error('Error in getAllClients controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function getClientByID(req, res) {
  try{
    const client = await Client.findById(req.params.id);
    if (!client) {return res.status(404).json({message: "Client not found!"})};
    res.json(client);
  }catch(err){
    console.error('Error in getClientByID controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function deleteClient(req, res) {
  try{
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    
    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json({ message: 'Client deleted successfully' });

  }catch(err){
    console.error('Error in deleteClient controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function updateClient(req, res) {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedClient = await Client.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(updatedClient);

  }catch(err){
    console.error('Error in updateClient controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function loginClient(req, res) {
  const { username, password } = req.body;

  try {
    // Find the client by username
    const client = await Client.findOne({ username });

    if (!client) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token 
const token = jwt.sign(
  { 
    id: client._id,
    role: 'client',
    username: client.username
  }, 
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

    res.json({ token, client });
  } catch (err) {
    console.error('Error in loginClient controller', err);
    res.status(500).json({ message: 'Server error' });
  }
}
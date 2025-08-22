// Quick fix for auth service to avoid username conflicts
// Add this to your auth.service.ts

async register(registerDto: any) {
  try {
    // Add prefix to avoid conflicts with seller usernames
    const userUsername = `user_${registerDto.username}`;
    
    // Check both tables for conflicts
    const existingUser = await this.userRepository.findOne({
      where: { username: userUsername }
    });
    
    const existingSeller = await this.sellerRepository.findOne({
      where: { username: registerDto.username }
    });
    
    if (existingUser) {
      throw new ConflictException('Username already exists in users');
    }
    
    if (existingSeller) {
      throw new ConflictException('Username conflicts with existing seller');
    }
    
    // Create user with prefixed username
    const user = this.userRepository.create({
      ...registerDto,
      username: userUsername
    });
    
    return await this.userRepository.save(user);
    
  } catch (error) {
    // Handle database constraint errors
    if (error.code === '23505') {
      throw new ConflictException('Username or email already exists');
    }
    throw error;
  }
}
